
const getColumnFn = (canvasCtx, fromX, toX, fromY, toY) => (columnIndex = 0) => {
    const maxX = toX - fromX;
    const height = toY - fromY;

    return canvasCtx.getImageData(fromX + columnIndex, fromY, 1, height);
};

const getColumnData = (column) => {
    const r = [];
    const g = [];
    const b = [];
    const a = [];
    const rgbSum = [];
    const pixelCount = column.data.length / 4;
    let greyScalePixelCount = 0;

    for (let i = 0; i < column.data.length - 3; i += 4) {
        let sum = 0;
        const pr = column.data[i];
        const pg = column.data[i + 1];
        const pb = column.data[i + 2];
        const pa = column.data[i + 3];

        r.push(pr);
        g.push(pg);
        b.push(pb);
        a.push(pa);
        rgbSum.push(pr + pg + pb);

        if (pr === pg && pg === pb) {
            greyScalePixelCount += 1;
        }
    }

    return {
        r, g, b, a,
        rgbSum,
        allGrey: greyScalePixelCount === pixelCount
    };
};

export {
    getColumnData
};
