self.configureBusy = false;
self.configureInterrupted = false;

const addPixel = (obj, pixel) => {
    obj.distribution[pixel] += 1;
    obj.minValue = Math.min(obj.minValue, pixel);
    obj.maxValue = Math.max(obj.maxValue, pixel);
    obj.maxCount = Math.max(obj.maxCount, obj.distribution[pixel]);
};


const initChannel = () => ({
    distribution: new Uint32Array(256).fill(0),
    minValue: 255,
    maxValue: 0,
    maxCount: 0
});


const initRow = () => ({
    r: initChannel(),
    g: initChannel(),
    b: initChannel(),
    a: initChannel(),
    pixelCount: 0,
    greyPixelCount: 0
});

const initColumn = () => ({
    r: 0,
    g: 0,
    b: 0,
    a: 0
});


const configure = (columnHeight = 0, imageData = [], groupHeight = 10) => {
    self.columnHeight = columnHeight;
    self.rows = Array(Math.ceil(columnHeight / groupHeight)).fill("").map(() => initRow());
    self.groupHeight = groupHeight;
    self.columnCount = imageData.length / (columnHeight * 4);
    self.columns = Array(self.columnCount).fill("").map(() => initColumn());

    const rows = Math.ceil(columnHeight / groupHeight);
    const rowLength = Math.floor(imageData.length / rows);

    if (imageData.length !== 0) {
        for (let i = 0; i < rows; i += 1) {
            const rowStart = i * rowLength;


            for (let j = 0; j < rowLength; j += 4) {
                if (rowStart + j >= imageData.length) {
                    break;
                }

                const r = imageData[rowStart + j];
                const g = imageData[rowStart + j + 1];
                const b = imageData[rowStart + j + 2];
                const a = imageData[rowStart + j + 3];

                const columnIndex = (j / 4) % self.columnCount;
                self.columns[columnIndex].r += r;
                self.columns[columnIndex].g += g;
                self.columns[columnIndex].b += b;
                self.columns[columnIndex].a += a;

                addPixel(self.rows[i].r, r);
                addPixel(self.rows[i].g, g);
                addPixel(self.rows[i].b, b);
                addPixel(self.rows[i].a, a);

                self.rows[i].pixelCount += 1;

                if (r === g && g === b) {
                    self.rows[i].greyPixelCount += 1;
                }
            }
        }
    }

    const maxRelativeCount = self.rows.reduce((acc, curr) => ({
        r: Math.max(acc.r, curr.r.maxCount / curr.pixelCount),
        g: Math.max(acc.g, curr.g.maxCount / curr.pixelCount),
        b: Math.max(acc.b, curr.b.maxCount / curr.pixelCount)
    }), {r: 0, g: 0, b: 0});

    const allGrey = !(self.rows.some((row) => row.greyPixelCount !== row.pixelCount));

    self.postMessage({
        type: "fullData",
        data: {
            rows: self.rows,
            columns: self.columns
        },
        allGrey,
        maxRelativeCount
    });

};

self.onmessage = (event) => {
    const {type} = event.data;

    switch (type) {
        case "configure": {
            const {height, imageData, groupHeight} = event.data;
            console.log("worker height: ", height);
            configure(height, new Uint8ClampedArray(imageData), groupHeight);
            break;
        }

        default:
            self.postMessage({type: "error", text: "unknown message type: " + type});

    }

};

export default self;
