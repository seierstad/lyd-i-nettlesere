import {html} from "htm/preact";
import {useEffect, useRef, useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "./state.js";


const histogramWorker = new Worker(new URL("./histogram-data-worker.js", import.meta.url));

const ChannelLine = (props = {}) => {
    const {
        channelData: {
            distribution = [],
            minValue,
            maxValue,
            maxCount
        } = {},
        lineNumber = 0,
        offsetX = 0,
        offsetY = 0,
        scaleY = 1,
        scaleX = 1,
        width = 1
    } = props;

    let pathData = `M${offsetX},${offsetY + lineNumber}`;
    const variableRegion = Array.from(distribution.slice(minValue, maxValue + 1)).map(v => v / width);
    const diffValues = variableRegion.map((v, i, a) => i === 0 ? v : v - a[i - 1]);

    if (minValue !== 0) {
        pathData += ` m${minValue},${diffValues[0] * scaleY} `;
    }

    pathData += diffValues.reduce((acc, curr, i) => {

        if (curr === 0) {
            return {
                ...acc,
                horisontal: acc.horisontal + 1
            };
        }

        const horisontal = ((acc.horisontal !== 0) ? (
            variableRegion[i - 1] === 0 ? ` m${acc.horisontal * scaleX}, 0` : ` h${acc.horisontal * scaleX}`
        ) : "");

        return {
            ...acc,
            result: acc.result + horisontal + ` l${scaleX},${-curr * scaleY}`,
            horisontal: 0
        };

    }, {
        result: "",
        horisontal: 0
    }).result;

    /*
    if (maxValue < distribution.length - 1) {
        pathData += `h${distribution.length - maxValue}`;
    }
    */

    return html`
        <path d=${pathData} />
    `;
};

const ChannelDots = (props = {}) => {
    const {
        channelData: {
            distribution = [],
            minValue,
            maxValue,
            maxCount
        } = {},
        lineNumber = 0,
        offsetX = 0,
        offsetY = 0,
        scaleY = 1,
        scaleX = 1,
        width = 1
    } = props;

    const variableRegion = Array.from(distribution.slice(minValue, maxValue + 1)).map(v => v / width);

    const y = offsetY + lineNumber;
    return variableRegion.map((d, i) => d !== 0 ? html`<circle cx=${offsetX + minValue + i * scaleX} cy=${y} r=${d * scaleX} opacity=${d} />` : null);
};


const Histogram = (props = {}) => {

    const {
        canvasContext = null,
        histogramData = {value: null}
    } = useContext(AppStateContext);

    const {
        selection: {
            from: {
                x: fromX = {value: 0},
                y: fromY = {value: 10}
            } = {},
            to: {
                x: toX = {value: 0},
                y: toY = {value: 10}
            } = {}
        } = {},
        updateFn
    } = props;

    const width = toX.value - fromX.value;
    const height = toY.value - fromY.value;

    const workerMessageHandler = (event = {}) => {
        console.log("melding fra worker!!!", event);
        const {type, data} = event.data;
        switch (type) {
            case "fullData": {
                updateFn(data);
                break;
            }

            default:
                console.log("histogram-data-worker sendte en rar melding: ", event);
        }
    };

    useEffect(() => {
        histogramWorker.addEventListener("message", workerMessageHandler);
        return () => histogramWorker.removeEventListener("message", workerMessageHandler);
    }, []);


    useEffect(() => {
        if (canvasContext !== null) {
            const width = toX.value - fromX.value;
            const height = toY.value - fromY.value;
            const imageData = canvasContext.getImageData(fromX.value, fromY.value, width, height).data;
            console.log(imageData);
            histogramWorker.postMessage({
                type: "configure",
                height,
                imageData: imageData.buffer
            }, [imageData.buffer]);
        }
        console.log("change has come to ekko");
    }, [fromX.value, toX.value, fromY.value, toY.value]);

    const {r, g, b} = useMemo(() => {
        if (!histogramData.value) {
            return {r: null, g: null, b: null};
        }
        return {
            r: histogramData.value.map(({r}, i) => html`
                <${ChannelDots} scaleY=${4} scaleX=${4} width=${width} channelData=${r} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"r_" + i} />
            `),
            g: histogramData.value.map(({g}, i) => html`
                <${ChannelDots} scaleY=${4} scaleX=${4} width=${width} channelData=${g} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"g_" + i} />
            `),
            b: histogramData.value.map(({b}, i) => html`
                <${ChannelDots} scaleY=${4} scaleX=${4} width=${width} channelData=${b} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"b_" + i} />
            `)
        };

    }, [histogramData.value]);


    return html`
        <svg class="histogram" preserveAspectRatio="xMinYMid slice" width="1024" height=${height + 1} viewBox="0 0 ${256 * 4 + 1} ${height + 1}">
            <rect x="0" y="0" width=${1024} height=${height + 1} stroke="none" class="background" />
            <g class="r" fill="none" stroke-width="1" class="channel r">
                ${r}
            </g>
            <g class="g" fill="none" stroke-width="1" class="channel g">
                ${g}
            </g>
            <g class="b" fill="none" stroke-width="1" class="channel b">
                ${b}
            </g>
        </svg>
    `;
};


export {
    Histogram
};
