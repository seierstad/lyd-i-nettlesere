import {html} from "htm/preact";
import {useEffect, useRef, useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "../state.js";


const HistogramForm = (props = {}) => {

    const {
        grouping = {value: 50},
        visibility = {},
        handlers = {},
        allGrey
    } = props;


    const groupingHandler = event => {
        const value = parseInt(event.target.value, 10);
        handlers.setGrouping(value);
    };

    const channelVisibilityHandler = event => {
        const visible = !!event.target.checked;
        const channel = event.target.value;
        handlers.setVisibility(channel, visible);
    };

    return html`
        <form
            class="histogram-form"
            method="post"
            target="."
        >
            <label>
                <span class="label-text">row height</span>
                <input
                    oninput=${groupingHandler}
                    step=${1}
                    type="number"
                    value=${grouping.value}
                />
            </label>
            ${!allGrey.value && html`
                <fieldset>
                    <legend>channels</legend>
                    <label>
                        <span class="label-text">red</span>
                        <input
                            checked=${visibility.r.value}
                            onchange=${channelVisibilityHandler}
                            type="checkbox"
                            value="r"
                        />
                    </label>

                    <label>
                        <span class="label-text">green</span>
                        <input
                            checked=${visibility.g.value}
                            onchange=${channelVisibilityHandler}
                            type="checkbox"
                            value="g"
                        />
                    </label>

                    <label>
                        <span class="label-text">blue</span>
                        <input
                            checked=${visibility.b.value}
                            onchange=${channelVisibilityHandler}
                            type="checkbox"
                            value="b"
                        />
                    </label>
                </fieldset>
            `}
        </form>
    `;
};


export {
    HistogramForm
};
