import {html} from "htm/preact";
import {useEffect, useRef, useContext} from "preact/hooks";

import {AppStateContext} from "../state.js";


const ActiveImage = (props = {}) => {
    const {
        activeImageIndex: idx = {value: null},
        images: {
            value: {
                [idx.value]: image = {}
            } = []
        },
        canvasContext = {value: null}
    } = useContext(AppStateContext);

    const {
        handlers: {
            dataSelection = {},
            setCanvasContext
        } = {}
    } = props;

    const {
        height = 200,
        width = 200,
        img = null,
        selection = {},
        position = 0
    } = image;


    const {
        from: {
            x: fromX = {value: 0},
            y: fromY = {value: 0}
        } = {},
        to: {
            x: toX = {value: width},
            y: toY = {value: height}
        } = {},
        height: selectionHeight = {value: height}
    } = selection;

    if (!image) {
        return null;
    }

    const canvas = useRef(null);

    const posX = Math.min(Math.max(position, fromX.value - 0.5), toX.value - 1.5);

    useEffect(() => {
        if (canvas.current !== null) {
            setCanvasContext(canvas.current.getContext("2d", {willReadFrequently: true}));
        }
    }, [canvas.current]);

    useEffect(() => {
        if (canvas.current !== null) {
            canvas.current.width = width;
            canvas.current.height = height;
        }
    }, [canvas.current, height, width]);

    useEffect(() => {
        if (canvasContext !== null && img !== null) {
            canvasContext.drawImage(img, 0, 0);
        }
    }, [canvasContext, img]);


    return html`
        <div id="active-image">
            <input
                id="from-x"
                max=${width}
                min="0"
                onInput=${dataSelection.from.x}
                step="1"
                type="range"
                value=${fromX.value}
            />
            <input
                id="from-y"
                max=${height}
                min="0"
                onInput=${dataSelection.from.y}
                step="1"
                type="range"
                value=${fromY.value}
            />
            <canvas id="lerret" ref=${canvas}></canvas>
            <svg
                height=${height}
                id="maske-og-posisjonsindikator"
                viewBox="0 0 ${width} ${height}"
                width=${width}
            >
                <g
                    fill="#dd0"
                    id="maske"
                >
                    <rect
                        height=${fromY.value}
                        id="maske-topp"
                        width="100%"
                        x="0"
                        y="0"
                    />
                    <rect
                        height=${height - toY.value}
                        id="maske-bunn"
                        width="100%"
                        x="0"
                        y=${toY.value}
                    />
                    <rect
                        height=${selectionHeight.value}
                        id="maske-venstre"
                        width=${fromX.value}
                        x="0"
                        y=${fromY.value}
                    />
                    <rect
                        height=${selectionHeight.value}
                        id="maske-hoyre"
                        width=${width - toX.value}
                        x=${toX.value}
                        y=${fromY.value}
                    />
                </g>
                <rect
                    fill="none"
                    height=${selectionHeight.value + 1}
                    id="posisjonsindikator"
                    stroke="blue"
                    stroke-width="1"
                    width="2"
                    x=${posX}
                    y=${fromY.value - 0.5}
                />
            </svg>
            <input
                id="to-x"
                max=${width}
                min=${0}
                onInput=${dataSelection.to.x}
                step="1"
                type="range"
                value=${toX.value}
            />
            <input
                id="to-y"
                max=${height}
                min=${0}
                onInput=${dataSelection.to.y}
                step="1"
                type="range"
                value=${toY.value}
            />
        </div>
    `;
};

export {
    ActiveImage
};
