import {batch} from "@preact/signals";


const getHandlers = (state) => ({
    updateData: (data, allGrey, maxRelativeCount) => batch(() => {
        state.histogram.rows.value = data.rows;
        state.histogram.columns.value = data.columns;
        state.images.value[state.activeImageIndex.value].selection.allGrey.value = allGrey;
        state.histogram.maxRelativeCount.value = maxRelativeCount;
    }),
    setVisibility: (channel, visible) => {
        state.histogram.visibility[channel].value = visible;
    },
    setGrouping: (size) => {
        state.histogram.grouping.value = size;
    }
});


export {
    getHandlers
};
