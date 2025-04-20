import {html} from "htm/preact";
import {useEffect, useRef, useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "./state.js";

const Histogram = (props = {}) => {
    return html`<svg class="histogram"></svg>`;
};


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
        selection: {
            from: {
                x: fromX = {value: 0},
                y: fromY = {value: 0}
            } = {},
            to: {
                x: toX = {value: width},
                y: toY = {value: height}
            } = {}
        } = {},
        position = 0
    } = image;


    if (!image) {
        return null;
    }

    const canvas = useRef(null);

    const selectionHeight = toY.value - fromY.value;

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

    const addPixel = (obj, pixel) => {
        obj.distribution[pixel] += 1;
        obj.min = Math.min(obj.min, pixel);
        obj.max = Math.max(obj.max, pixel);
    };

    const histogramData = useMemo(() => {
        if (canvasContext === null) {
            return [{r: [], g: [], b: []}];
        }
        const result = [];

        const width = toX.value - fromX.value;

        for (let i = fromY.value; i < toY.value; i += 1) {
            const row = canvasContext.getImageData(fromX.value, fromY.value + i, width, 1);
            const r = {
                distribution: new Array(256).fill(0),
                min: 255,
                max: 0
            };
            const g = {
                distribution: new Array(256).fill(0),
                min: 255,
                max: 0
            };
            const b = {
                distribution: new Array(256).fill(0),
                min: 255,
                max: 0
            };
            const a = {
                distribution: new Array(256).fill(0),
                min: 255,
                max: 0
            };

            for (let j = 0; j < row.data.length; j += 4) {
                addPixel(r, row.data[j]);
                addPixel(g, row.data[j + 1]);
                addPixel(b, row.data[j + 2]);
                addPixel(a, row.data[j + 3]);
            }
            result.push({r, g, b, a});
        }
        return result;

    }, [canvasContext, fromX.value, toX.value, fromY.value, toY.value]);

    return html`
        <section id="visuell-analyse">
            <div id="active-image">
                <input
                    id="from-x" type="range" min="0" max=${width} value=${fromX.value} step="1"
                    onInput=${dataSelection.from.x}
                />
                <input
                    id="from-y" type="range" min="0" max=${height} value=${fromY.value} step="1"
                    onInput=${dataSelection.from.y}
                />
                <canvas id="lerret" ref=${canvas}></canvas>
                <svg id="maske-og-posisjonsindikator" width=${width} height=${height} viewBox="0 0 ${width} ${height}">
                    <g id="maske" fill="#dd0">
                        <rect id="maske-topp" x="0" width="100%" y="0" height=${fromY.value} />
                        <rect id="maske-bunn" x="0" width="100%" y=${toY.value} height=${height - toY.value} />
                        <rect id="maske-venstre" x="0" width=${fromX.value} y=${fromY.value} height=${selectionHeight} />
                        <rect id="maske-hoyre" x=${toX.value} width=${width - toX.value} y=${fromY.value} height=${selectionHeight} />
                    </g>
                    <rect id="posisjonsindikator" x=${posX} width="2" y=${fromY.value - 0.5} height=${selectionHeight + 1} stroke-width="1" stroke="blue" fill="none"/>
                </svg>
                <input
                    id="to-x" type="range" min=${0} max=${width} value=${toX.value} step="1"
                    onInput=${dataSelection.to.x}
                />
                <input
                    id="to-y" type="range" min=${0} max=${height} value=${toY.value} step="1"
                    onInput=${dataSelection.to.y}
                />
            </div>
            <${Histogram} data=${histogramData} />
        </section>
    `;
};

export {
    ActiveImage
};
