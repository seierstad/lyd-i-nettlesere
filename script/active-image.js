import {html} from "htm/preact";
import {useEffect, useRef} from "preact/hooks";


const ActiveImage = (props = {}) => {
    const {
        image: {
            height = {value: 200},
            width = {value: 200}
        } = {},
        selection: {
            from: {
                x: fromX = {value: 0},
                y: fromY = {value: 0}
            } = {},
            to: {
                x: toX = {value: width.value},
                y: toY = {value: height.value}
            } = {}
        } = {},
        position = 0,
        handlers: {
            dataSelection = {},
            setCanvasContext
        } = {}
    } = props;

    const canvas = useRef(null);

    const selectionHeight = toY.value - fromY.value;

    const posX = Math.min(Math.max(position, fromX - 0.5), toX - 1.5);

    useEffect(() => {
        if (canvas.current !== null) {
            setCanvasContext(canvas.current.getContext("2d", {willReadFrequently: true}));
        }
    }, [canvas.current]);

    useEffect(() => {
        if (canvas.current !== null) {
            canvas.current.width = height.value;
            canvas.current.height = width.value;
        }
        console.log(canvas.current);
    }, [canvas.current, height.value, width.value]);

    return html`<section id="visuell-analyse">
        <div id="active-image">
            <input
                id="from-x" type="range" min="0" max=${width.value} value=${fromX.value} step="1"
                onInput=${dataSelection.from.x}
            />
            <input
                id="from-y" type="range" min="0" max=${height.value} value=${fromY.value} step="1"
                onInput=${dataSelection.from.y}
            />
            <canvas id="lerret" ref=${canvas}></canvas>
            <svg id="maske-og-posisjonsindikator" width=${width.value} height=${height.value} viewBox="0 0 ${width.value} ${height.value}">
                <g id="maske" fill="#dd0">
                    <rect id="maske-topp" x="0" width="100%" y="0" height=${fromY.value} />
                    <rect id="maske-bunn" x="0" width="100%" y=${toY} height=${height.value - toY.value} />
                    <rect id="maske-venstre" x="0" width=${fromX.value} y=${fromY.value} height=${selectionHeight} />
                    <rect id="maske-hoyre" x=${toX.value} width=${width.value - toX.value} y=${fromY.value} height=${selectionHeight} />
                </g>
                <rect id="posisjonsindikator" x=${posX} width="2" y=${fromY.value - 0.5} height=${selectionHeight + 1} stroke-width="1" stroke="blue" fill="none"/>
            </svg>
            <input
                id="to-x" type="range" min=${0} max=${width.value} value=${toX.value} step="1"
                onInput=${dataSelection.to.x}
            />
            <input
                id="to-y" type="range" min=${0} max=${height.value} value=${toY.value} step="1"
                onInput=${dataSelection.to.y}
            />
        </div>
    </section>`;
};

export {
    ActiveImage
};
