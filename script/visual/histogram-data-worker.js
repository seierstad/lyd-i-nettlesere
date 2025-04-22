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


const init = () => ({
    r: initChannel(),
    g: initChannel(),
    b: initChannel(),
    a: initChannel()
});


const configure = (columnHeight = 0, imageData = []) => {
    self.columnHeight = columnHeight;
    self.rows = Array(columnHeight).fill("").map(() => init());

    if (imageData.length !== 0) {
        const rowLength = imageData.length / columnHeight;

        for (let i = 0; i < columnHeight; i += 1) {
            const rowStart = i * rowLength;

            for (let j = 0; j < rowLength; j += 4) {
                addPixel(self.rows[i].r, imageData[rowStart + j]);
                addPixel(self.rows[i].g, imageData[rowStart + j + 1]);
                addPixel(self.rows[i].b, imageData[rowStart + j + 2]);
                addPixel(self.rows[i].a, imageData[rowStart + j + 3]);
            }
        }
    }
    self.postMessage({
        type: "fullData",
        data: self.rows
    });

};

self.onmessage = (event) => {
    const {type} = event.data;

    switch (type) {
        case "configure": {
            const {height, imageData} = event.data;
            console.log("worker height: ", height);
            configure(height, new Uint8ClampedArray(imageData));
            break;
        }

        default:
            self.postMessage({type: "error", text: "unknown message type: " + type});

    }

};
