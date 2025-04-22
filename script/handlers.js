import {createContext} from "preact";
import {signal, batch} from "@preact/signals";

import {state} from "./state.js";
import {compareMetadata} from "./metadata.js";


const getHandlers = (state) => ({
    activeImageIndex: index => state.activeImageIndex.value = index,
    setActiveImage: metadata => {
        const matchingIndex = state.images.value.findIndex(compareMetadata(metadata));
        if (matchingIndex !== -1) {
            state.activeImageIndex.value = matchingIndex;
        }
    },
    dataSelection: {
        from: {
            x: event => {
                state.images.value[state.activeImageIndex.value].selection.from.x.value = parseInt(event.target.value, 10);
            },
            y: event => {
                state.images.value[state.activeImageIndex.value].selection.from.y.value = parseInt(event.target.value, 10);
            }
        },
        to: {
            x: event => {
                state.images.value[state.activeImageIndex.value].selection.to.x.value = parseInt(event.target.value, 10);
            },
            y: event => {
                state.images.value[state.activeImageIndex.value].selection.to.y.value = parseInt(event.target.value, 10);
            }
        }
    },
    setCanvasContext: context => state.canvasContext = context,
    fileLoadedHandler: imgData => batch(() => {
        const {name, size, lastModified, height, width, img} = imgData;
        state.images.value = [
            ...state.images.value,
            {
                active: signal(false),
                name,
                size,
                lastModified,
                img,
                height,
                width,
                selection: {
                    from: {
                        x: signal(0),
                        y: signal(0)
                    },
                    to: {
                        x: signal(width),
                        y: signal(height)
                    }
                }
            }
        ];
        if (state.activeImageIndex.value === null) {
            state.activeImageIndex.value = state.images.value.length - 1;
        }
    }),
    unloadImageHandler: metadata => batch(() => {
        const matchingIndex = state.images.value.findIndex(compareMetadata(metadata));
        if (matchingIndex !== -1) {
            if (typeof state.activeImageIndex.value === "number" && state.activeImageIndex.value > matchingIndex) {
                state.activeImageIndex.value -= 1;
            }
            state.images.value = [
                ...state.images.value.slice(0, matchingIndex),
                ...state.images.value.slice(matchingIndex + 1)
            ];
        }
    }),
    updateHistogramData: data => state.histogramData.value = data
});


const AppHandlerContext = createContext();

const handlers = getHandlers(state);

export {
    AppHandlerContext,
    handlers
};
