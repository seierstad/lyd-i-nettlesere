import {html} from "htm/preact";
import {useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "../state.js";
import {AppHandlersContext} from "../handlers.js";


const ChannelLine = (props = {}) => {
    const {
        avg = 0,
        data = [],
        offsetX = 0,
        offsetY = 0,
        maxValue = 255
    } = props;

    const diffValues = data.map((v, i, a) => i === 0 ? v - avg : v - a[i - 1]);

    const pathData = `M${offsetX},${maxValue - offsetY - avg}` + diffValues.reduce((acc, curr, i, arr) => {
        const final = (i !== arr.length - 1) ? "" : ` v${-(avg - data[i])}z`;

        return acc + ` l1,${-curr}` + final;

    }, "");

    return html`
        <path d=${pathData} />
    `;
};


const sumMinMax = (acc, curr) => ({
    sum: acc.sum + curr,
    min: Math.min(acc.min, curr),
    max: Math.max(acc.max, curr)
});

const PixelSum = (props = {}) => {

    const {
        histogram: {
            columns = {value: null},
            visibility = {}
        } = {}
    } = useContext(AppStateContext);

    const {
        histogram: handlers = {}
    } = useContext(AppHandlersContext);

    const {
        selection: {
            allGrey = {value: false},
            height = {value: 10},
            width
        } = {}
    } = props;

    const {r = null, g = null, b = null, grey = null} = useMemo(() => {

        if (!columns.value) {
            return {r: null, g: null, b: null};
        }

        const rScaled = columns.value.map(({r}) => r / height.value);
        const gScaled = columns.value.map(({g}) => g / height.value);
        const bScaled = columns.value.map(({b}) => b / height.value);

        const rStats = rScaled.reduce(sumMinMax, {sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY});
        const gStats = gScaled.reduce(sumMinMax, {sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY});
        const bStats = bScaled.reduce(sumMinMax, {sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY});

        if (allGrey.value) {
            return {
                grey: html`
                    <${ChannelLine} avg=${rStats.sum / rScaled.length} min=${rStats.min} max=${rStats.max} width=${rScaled.length} data=${rScaled} offsetX=${0.5} offsetY=${0.5} key=${"grey"} />
                `
            };
        }
        return {
            r: html`<${ChannelLine} avg=${rStats.sum / rScaled.length} min=${rStats.min} max=${rStats.max} width=${rScaled.length} data=${rScaled} offsetX=${0.5} offsetY=${0.5} key=${"r"} />`,
            g: html`<${ChannelLine} avg=${gStats.sum / gScaled.length} min=${gStats.min} max=${gStats.max} width=${gScaled.length} data=${gScaled} offsetX=${0.5} offsetY=${0.5} key=${"g"} />`,
            b: html`<${ChannelLine} avg=${bStats.sum / bScaled.length} min=${bStats.min} max=${bStats.max} width=${bScaled.length} data=${bScaled} offsetX=${0.5} offsetY=${0.5} key=${"b"} />`
        };

    }, [columns.value, allGrey.value]);


    return html`
        <svg
            class="pixel-sum"
            height="100%"
            preserveAspectRatio="xMinYMid slice"
            viewBox="0 0 ${width.value} 255"
            width=${width.value}
        >
            ${visibility.r.value && html`<g class="channel red">${r}</g>`}
            ${visibility.g.value && html`<g class="channel green">${g}</g>`}
            ${visibility.b.value && html`<g class="channel blue">${b}</g>`}
            ${allGrey.value && html`<g class="channel grey">${grey}</g>`}
        </svg>
    `;
};


export {
    PixelSum
};
