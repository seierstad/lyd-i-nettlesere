
/* canvas */
const canvasCtx = canvas.getContext("2d", {willReadFrequently: true});
let aktivtBildeIndeks = 0;


const visBildeICanvas = (bilde) => {
    canvas.width = bilde.naturalWidth;
    canvas.height = bilde.naturalHeight;

    //context.filter = 'blur(10px)';
    canvasCtx.drawImage(bilde, 0, 0);
};


const findMetadataMatchIndex = (list, metadata) => {
    const {name, size, lastModified} = metadata;
    return list.findIndex(element => element.name === name && element.size === size && element.lastModified === lastModified);
};

const klikkIBildevelger = (event) => {
    const metadataString = event.target.closest("ul, a").href?.split("#")?.pop();
    if (metadataString) {
        event.stopPropagation();
        event.preventDefault();

        const metadata = stringToMetadata(metadataString);
        const indeks = findMetadataMatchIndex(bilder, metadata);

        if (indeks !== -1) {
            aktivtBildeIndeks = indeks;
            oppdaterSpaker(bilder[indeks]);
            visBildeICanvas(bilder[indeks].image);
            oppdaterMaske(bilder[indeks]);
        }
    }
};

const leggTilEgenskap = (egenskap, verdi, liste) => {
    const term = document.createElement("dt");
    term.innerText = egenskap;
    liste.appendChild(term);

    const data = document.createElement("dd");
    if (typeof verdi === "string") {
        data.innerText = verdi;
    } else {
        data.appendChild(verdi);
    }
    liste.appendChild(data);
};


/*
    Dette er en funksjon som returnerer en funksjon.
    Hensikten med dét er å kunne ta vare på filnavnet sammen med innholdet i bildet.
*/
const bildeKlart = (metadata) => (event) => {
    const image = event.target;
    const width = event.target.naturalWidth;
    const height = event.target.naturalHeight;

    const selection = {
        x: {
            from: 0,
            to: width
        },
        y: {
            from: 0,
            to: height
        }
    };
    bilder.push({image, ...metadata, width, height, selection}); // legger til bildet i javascript-listen over bilder
};

/*
    Når en funksjon bare tar én parameter trengs ikke parentesene.
    Her er en funksjon med én parameter som returnerer en funksjon med én parameter:
*/
const filLastet = filMetadata => event => {
    const bilde = new Image();
    bilde.src = event.target.result;
    const bildeKlartMedMetadata = bildeKlart(filMetadata);
    bilde.addEventListener("load", bildeKlartMedMetadata, {once: true});
};

const lastBilde = (event) => {
    event.preventDefault();
    if (event.dataTransfer.items) {
        [...event.dataTransfer.items].filter(item => item.kind === "file" && item.type.indexOf("image/") === 0).forEach((item, i) => {
            const fil = item.getAsFile();
            filLeser = new FileReader();
            filLeser.readAsDataURL(fil);

            const {name, size, lastModified} = fil;
            const metadata = {name, size, lastModified};
            if (findMetadataMatchIndex(bilder, metadata) === -1) {
                // laster bare inn bilder som ikke allerede er lastet inn
                // (legg etv. til flere felter å teste hvis filnavn, sist endret (i millisekunder) og størrelse (i bytes) ikke er nok til å skille)
                filLeser.addEventListener("load", filLastet(metadata), {once: true});
            }
        });
    }
};

const ikkeByttSide = (event) => {
    event.preventDefault();
};

canvas.addEventListener("dragover", ikkeByttSide); // uten dette ville nettleseren tolke dra-og-slipp som navigasjon til et annet dokument i stedet for å laste det inn som innhold til html-dokumentet
canvas.addEventListener("drop", lastBilde);


const slettBilde = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const metadata = stringToMetadata(event.submitter.value);

    /* fjerner bildet fra bilder[] */
    let index = findMetadataMatchIndex(bilder, metadata);
    while (index !== -1) {
        bilder.splice(index, 1);
        index = findMetadataMatchIndex(bilder, metadata);
    }

    /* fjerner visningen fra dokumentstrukturen */
    const htmlElement = event.submitter.closest("li");
    if (htmlElement) {
        document.getElementById("innlastede-bilder-liste").removeChild(htmlElement);
    }
};

const billedvelger = document.getElementById("innlastede-bilder-velger");
billedvelger.addEventListener("submit", slettBilde);
billedvelger.addEventListener("click", klikkIBildevelger);


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

    console.log(column);
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
