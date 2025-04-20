import "preact/debug";
import {html, render} from "htm/preact";

import {ImagesList} from "./script/images-list.js";
import {ActiveImage} from "./script/active-image.js";
import {state, AppStateContext} from "./script/state.js";
import {handlers, AppHandlerContext} from "./script/handlers.js";

const appContainer = document.querySelector(".preact-innhold-vises-her");

render(
    html`
        <${AppStateContext.Provider} value=${state}>
            <${AppHandlerContext.Provider} value=${handlers}>
                <h1>smilefjøs</h1>
                <${ImagesList} images=${state.images} handlers=${handlers} />
                <${ActiveImage} handlers=${handlers} />
            <//>
        <//>
    `,
    appContainer
);

/*

let summingAttenuator;
let oscillator;
let omhyler; // envelope = omhylningskurve, så en engelsk "envelope generator" blir en norsk "omhyler" :)
let scaleFn;
let columnFn = null;
let columnIndex = 0;

const aktiveringsDialog = document.getElementById("bli-lyd");
aktiveringsDialog.addEventListener("close", bliLyd, {once: true});
*/

