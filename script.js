import "preact/debug";
import {html, render} from "htm/preact";
import {createContext} from "preact";
import {signal} from "@preact/signals";

import {ImagesList} from "./script/images-list.js";
import {ActiveImage} from "./script/active-image.js";
//import {noop} from "./script/event-handlers.js";

//document.addEventListener("drop", noop);

const getHandlers = (state) => ({
    activeImageIndex: index => state.activeImageIndex.value = index,
    dataSelection: {
        from: {
            x: event => state.images[state.activeImageIndex].selection.from.x.value = parseInt(event.target.value, 10),
            y: event => state.images[state.activeImageIndex].selection.from.y.value = parseInt(event.target.value, 10)
        },
        to: {
            x: event => state.images[state.activeImageIndex].selection.to.x.value = parseInt(event.target.value, 10),
            y: event => state.images[state.activeImageIndex].selection.to.y.value = parseInt(event.target.value, 10)
        }
    },
    setCanvasContext: context => state.canvasContext = context
});


const AppStateContext = createContext();
const AppHandlerContext = createContext();
const state = {
    activeImageIndex: signal(0),
    canvasContext: null,
    images: [{
        active: signal(true),
        name: "test",
        size: 57425462,
        lastModified: 346454724564544,
        selection: {
            from: {
                x: signal(0),
                y: signal(0)
            },
            to: {
                x: signal(160),
                y: signal(200)
            }
        }
    }]
};
const handlers = getHandlers(state);

const appContainer = document.querySelector(".preact-innhold-vises-her");

render(
    html`
        <${AppStateContext.Provider} value=${state}>
            <${AppHandlerContext.Provider} value=${handlers}>
                <h1>smilefjøs</h1>
                <${ImagesList} images=${state.images} />
                <${ActiveImage} ...${state.images[state.activeImageIndex]} handlers=${handlers} />
            <//>
        <//>
    `,
    appContainer
);

/*
const sources = [];

let audioContext;
let summingAttenuator;
let oscillator;
let omhyler; // envelope = omhylningskurve, så en engelsk "envelope generator" blir en norsk "omhyler" :)
let filLeser;
let aktivtBildeIndeks = null;
let scaleFn;
let columnFn = null;
let columnIndex = 0;

const aktiveringsDialog = document.getElementById("bli-lyd");
aktiveringsDialog.addEventListener("close", bliLyd, {once: true});
*/

/* setter opp dra-og-slipp av billedfiler til canvas-elementet  */

const bilder = []; // liste over lastede bilder (tom i utgangspunktet)


/* et par funksjoner for å serialisere og deserialisere metadata om lastede filer: */
const stringToMetadata = str => {
    const [sizeString, lastModifiedString, ...nameParts] = str.split("-");
    const name = nameParts.join("-");

    return {
        size: parseInt(sizeString, 10),
        lastModified: parseInt(lastModifiedString, 10),
        name
    };
};

const metadataToString = metadata => {
    const {size, lastModified, name} = metadata;
    return [size, lastModified, name].join("-");
};

export {
    AppStateContext,
    AppHandlerContext
};
