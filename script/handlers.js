import {createContext} from "preact";
import {signal, batch, computed} from "@preact/signals";

import {state} from "./state.js";
import {compareMetadata} from "./metadata.js";
import {getHandlers as getHistogramHandlers} from "./visual/histogram-handlers.js";


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
                const selection = state.images.value[state.activeImageIndex.value].selection;
                selection.from.x.value = parseInt(event.target.value, 10);
            },
            y: event => {
                const selection = state.images.value[state.activeImageIndex.value].selection;
                selection.from.y.value = parseInt(event.target.value, 10);
            }
        },
        to: {
            x: event => {
                const selection = state.images.value[state.activeImageIndex.value].selection;
                selection.to.x.value = parseInt(event.target.value, 10);
            },
            y: event => {
                const selection = state.images.value[state.activeImageIndex.value].selection;
                selection.to.y.value = parseInt(event.target.value, 10);
            }
        }
    },
    setCanvasContext: context => state.canvasContext = context,
    fileLoadedHandler: imgData => batch(() => {
        const {name, size, lastModified, height, width, img} = imgData;

        const imageState = {
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
                },
                allGrey: signal(false)
            }
        };

        imageState.selection.width = computed(() => imageState.selection.to.x.value - imageState.selection.from.x.value);
        imageState.selection.height = computed(() => imageState.selection.to.y.value - imageState.selection.from.y.value);

        state.images.value = [
            ...state.images.value,
            imageState
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
    histogram: getHistogramHandlers(state)
});


const AppHandlersContext = createContext();

const handlers = getHandlers(state);

export {
    AppHandlersContext,
    handlers
};
