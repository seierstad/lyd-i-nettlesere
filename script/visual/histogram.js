import {html} from "htm/preact";
import {useEffect, useRef, useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "../state.js";
import {AppHandlersContext} from "../handlers.js";

const histogramWorker = new Worker(new URL("./histogram-data-worker.js", import.meta.url), {"type": "module"});

const ChannelLine = (props = {}) => {
    const {
        channelData: {
            distribution = [],
            minValue,
            maxValue
        } = {},
        lineNumber = 0,
        offsetX = 0,
        offsetY = 0,
        scaleY = 1,
        scaleX = 1,
        width = 1,
        spacingY = 1
    } = props;

    let pathData = `M${offsetX},${offsetY + lineNumber * spacingY}`;
    const variableRegion = Array.from(distribution.slice(minValue, maxValue + 1)).map(v => v / width);
    const diffValues = variableRegion.map((v, i, a) => i === 0 ? v : v - a[i - 1]);

    if (minValue !== 0) {
        pathData += ` m${(minValue - 1) * scaleX},0`;
    }

    pathData += diffValues.reduce((acc, curr, i, arr) => {

        if (curr === 0) {
            return {
                ...acc,
                horisontal: acc.horisontal + 1
            };
        }

        const horisontal = ((acc.horisontal !== 0) ? (
            variableRegion[i - 1] === 0 ? ` m${acc.horisontal * scaleX}, 0` : ` h${acc.horisontal * scaleX}`
        ) : "");

        const final = (i !== arr.length - 1) ? "" : (i === distribution.length - 1) ? ` v${(distribution[maxValue] / width) * scaleY}` : ` l${scaleX},${(distribution[maxValue] / width) * scaleY}`;
        return {
            ...acc,
            result: acc.result + horisontal + ` l${scaleX},${-curr * scaleY}` + final,
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
    return (
        variableRegion.map((d, i) => d !== 0 ? html`
            <circle
                cx=${offsetX + minValue + i * scaleX}
                cy=${y}
                opacity=${d}
                r=${d * scaleX}
            />
        ` : null)
    );
};


const Histogram = (props = {}) => {

    const {
        canvasContext = null,
        histogram: {
            rows = {value: null},
            grouping = {value: 50},
            maxRelativeCount = {value: {r: 0, g: 0, b: 0}},
            visibility = {}
        } = {}
    } = useContext(AppStateContext);

    const {
        histogram: handlers = {}
    } = useContext(AppHandlersContext);

    const {
        selection: {
            from: {
                x: fromX = {value: 0},
                y: fromY = {value: 10}
            } = {},
            allGrey = {value: false},
            width = {value: 10},
            height = {value: 10}
        } = {}
    } = props;

    const workerMessageHandler = (event = {}) => {

        const {type, data} = event.data;
        switch (type) {
            case "fullData": {
                const {allGrey, maxRelativeCount} = event.data;
                handlers.updateData(data, allGrey, maxRelativeCount);
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
            const imageData = canvasContext.getImageData(fromX.value, fromY.value, width.value, height.value).data;
            histogramWorker.postMessage({
                type: "configure",
                height: height.value,
                imageData: imageData.buffer,
                groupHeight: grouping.value
            }, [imageData.buffer]);
        }
    }, [fromX.value, fromY.value, width.value, height.value, grouping.value]);

    const {r = null, g = null, b = null, grey = null} = useMemo(() => {
        console.log("beregner svg:");
        console.log({grey: allGrey.value, maxRelativeCount: maxRelativeCount.value});

        if (!rows.value) {
            return {r: null, g: null, b: null};
        }

        const maxAcrossChannels = Math.max(maxRelativeCount.value.r, Math.max(maxRelativeCount.value.g, maxRelativeCount.value.b));

        if (allGrey.value) {
            return {
                grey: rows.value.map(({r, pixelCount}, i) => html`
                    <${ChannelLine} scaleY=${grouping.value / maxAcrossChannels} scaleX=${4} width=${pixelCount} channelData=${r} spacingY=${grouping.value} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"r_" + i} />
                `)
            };
        }
        return {
            r: rows.value.map(({r, pixelCount}, i) => html`
                <${ChannelLine} scaleY=${grouping.value / maxAcrossChannels} scaleX=${4} width=${pixelCount} channelData=${r} spacingY=${grouping.value} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"r_" + i} />
            `),
            g: rows.value.map(({g, pixelCount}, i) => html`
                <${ChannelLine} scaleY=${grouping.value / maxAcrossChannels} scaleX=${4} width=${pixelCount} channelData=${g} spacingY=${grouping.value} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"g_" + i} />
            `),
            b: rows.value.map(({b, pixelCount}, i) => html`
                <${ChannelLine} scaleY=${grouping.value / maxAcrossChannels} scaleX=${4} width=${pixelCount} channelData=${b} spacingY=${grouping.value} lineNumber=${i} offsetX=${0.5} offsetY=${0.5} key=${"b_" + i} />
            `)
        };

    }, [rows.value, allGrey.value, maxRelativeCount.value]);


    return html`
        <svg
            class="histogram"
            height=${height.value + 1}
            preserveAspectRatio="xMinYMid slice"
            viewBox="0 0 ${256 * 4 + 1} ${height.value + 1}"
            width="1024"
        >
            <rect
                class="background"
                height=${height.value + 1}
                stroke="none"
                width=${1024}
                x="0"
                y="0"
            />
            ${visibility.r.value && html`<g class="channel red">${r}</g>`}
            ${visibility.g.value && html`<g class="channel green">${g}</g>`}
            ${visibility.b.value && html`<g class="channel blue">${b}</g>`}
            ${allGrey.value && html`<g class="channel grey">${grey}</g>`}
        </svg>
    `;
};


export {
    Histogram
};
