
/*
    Jeg liker å definere alle konstantverdier i toppen av filen, rett under import av eventuelle avhengigheter.
    Årsaken er at det da blir fort gjort å åpne filen og justere konstantene uten å måtte lete nedover i koden.

    Javascript legger ingen føringer for hva konstanter kan hete
    (ut over begrensningene som gjelder for variabelnavn, f.eks. kan de ikke inneholde matematiske operatorer
    eller tegn som har syntaktisk betydning for språket, og de kan heller ikke frome med et siffer.)
*/

const ATTACK_TIME_S = 0.2;
const DECAY_TIME_S = 0.1;
const SUSTAIN_LEVEL = 0.5;
const RELEASE_TIME_S = 0.5;

/*
    Deklarerer variabler som kan være kjekke å ha tilgang til fra hvor som helst.
    (Globale variabler er en dårlig idé i seriøs kode, men for enkelhets skyld i opplæringsøyemed tenker jeg det går greit.)
*/

const sources = [];

let audioContext;
let summingAttenuator;
let oscillator;
let omhyler; // envelope = omhylningskurve, så en engelsk "envelope generator" blir en norsk "omhyler" :)
let filLeser;
let aktivtBildeIndeks = null;
let scaleFn;
let columnFn = null;
let columnIndex = 0;

const aktiveringsDialog = document.getElementById("bli-lyd");
aktiveringsDialog.addEventListener("close", bliLyd, {once: true});




/* funksjoner for å lage en oscillator-node, koble den til lydutgangen, frome og stoppe */

/*
    Dette er den nye syntaksen for å definere en funksjon i Javascript:
    herfra bruker vi bare den nye syntaksen, siden den gir oss en feilmelding hvis vi ved et uhell prøver å definere samme funksjonsnavn to ganger.
*/

const nyOscillator = () => {
    oscillator = context.createOscillator();
    omhyler = context.createGain();

    oscillator.connect(omhyler);
    omhyler.connect(context.destination);
};



const startOscillator = () => {
    oscillator.start();
    omhyler.gain.setValueAtTime(0, context.currentTime);
    omhyler.gain.linearRampToValueAtTime(1, context.currentTime + ATTACK_TIME_S);

    /* setTimeout kjører første parameter (en funksjon) etter det antall millisekunder som angis av andre parameter */
    setTimeout(
        () => omhyler.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, context.currentTime + DECAY_TIME_S),
        ATTACK_TIME_S * 1000
    );
};

const stoppOscillator = () => {
    const stopptid = context.currentTime + RELEASE_TIME_S;
    oscillator.stop(stopptid);
    omhyler.gain.linearRampToValueAtTime(0, stopptid);
    oscillator.addEventListener("ended", nyOscillator, {once: true});
};

const settFrekvens = (event) => {
    const frekvens = parseFloat(event.target.value);
    oscillator.frequency.setValueAtTime(frekvens, context.currentTime);
};

const settWaveform = (event) => {
    oscillator.type = event.target.value;
};


/* finner html-elementene som skal styre funksjonene og sørger for at funksjonene kjører når vi klikker på dem */

const nyOscillatorKnapp = document.getElementById("ny-oscillator");
nyOscillatorKnapp.addEventListener("click", nyOscillator);

const startOscillatorKnapp = document.getElementById("start-oscillator");
startOscillatorKnapp.addEventListener("click", startOscillator);

const stoppOscillatorKnapp = document.getElementById("stopp-oscillator");
stoppOscillatorKnapp.addEventListener("click", stoppOscillator);

const frekvensSpak = document.getElementById("oscillator-frekvens-spak");
frekvensSpak.addEventListener("input", settFrekvens);

const oscillatorWaveform = document.getElementById("oscillator-waveform");
oscillatorWaveform.addEventListener("change", settWaveform);


/* canvas */
const canvas = document.getElementById("lerret");
const canvasCtx = canvas.getContext("2d", {willReadFrequently: true});

/* maske */
const maske = document.getElementById("maske-og-posisjonsindikator");
const maskeTopp = document.getElementById("maske-topp");
const maskeBunn = document.getElementById("maske-bunn");
const maskeVenstre = document.getElementById("maske-venstre");
const maskeHoyre = document.getElementById("maske-hoyre");
const posisjonsindikator = document.getElementById("posisjonsindikator");

/* setter opp dra-og-slipp av billedfiler til canvas-elementet  */

const bilder = []; // liste over lastede bilder (tom i utgangspunktet)


/* et par funksjoner for å serialisere og deserialisere metadata om lastede filer: */
const stringToMetadata = str => {
    const [sizeString, lastModifiedString, ...nameParts] = str.split("-");
    const name = nameParts.join("-");

    return {
        size: parseInt(sizeString, 10),
        lastModified: parseInt(lastModifiedString, 10),
        name
    };
};

const metadataToString = metadata => {
    const {size, lastModified, name} = metadata;
    return [size, lastModified, name].join("-");
};

const oppdaterMaske = (billedData) => {
    const {
        height,
        width,
        selection: {
            x: {
                from: fromX,
                to: toX
            },
            y: {
                from: fromY,
                to: toY
            }
        }
    } = billedData;

    maske.width.baseVal.value = width;
    maske.height.baseVal.value = height;
    maske.viewBox.baseVal.width = width;
    maske.viewBox.baseVal.height = height;

    maskeTopp.height.baseVal.value = fromY;

    maskeBunn.y.baseVal.value = toY;
    maskeBunn.height.baseVal.value = height - toY;

    const selectionHeight = toY - fromY;

    maskeVenstre.width.baseVal.value = fromX;
    maskeVenstre.y.baseVal.value = fromY;
    maskeVenstre.height.baseVal.value = selectionHeight;

    maskeHoyre.x.baseVal.value = toX;
    maskeHoyre.width.baseVal.value = width - toX;
    maskeHoyre.y.baseVal.value = fromY;
    maskeHoyre.height.baseVal.value = selectionHeight;

    posisjonsindikator.y.baseVal.value = fromY - 0.5;
    posisjonsindikator.height.baseVal.value = selectionHeight + 1;
    if (posisjonsindikator.x.baseVal.value < fromX - 0.5) {
        posisjonsindikator.x.baseVal.value = fromX - 0.5;
    } else if (posisjonsindikator.x.baseVal.value > toX - 1.5) {
        posisjonsindikator.x.baseVal.value = toX - 1.5;
    }

};


const fromXSpak = document.getElementById("from-x");
const toXSpak = document.getElementById("to-x");
const fromYSpak = document.getElementById("from-y");
const toYSpak = document.getElementById("to-y");

const getDataSelectionHandler = (dimension, constraint) => (event) => {
    const value = parseInt(event.target.value, 10);
    if (aktivtBildeIndeks !== null && bilder[aktivtBildeIndeks]) {
        bilder[aktivtBildeIndeks].selection[dimension][constraint] = value;
        oppdaterMaske(bilder[aktivtBildeIndeks]);
    }
    const {x, y} = bilder[aktivtBildeIndeks].selection;
    columnFn = getColumnFn(canvasCtx, x.from, x.to, y.from, y.to);
};

fromXSpak.addEventListener("input", getDataSelectionHandler("x", "from"));
fromYSpak.addEventListener("input", getDataSelectionHandler("y", "from"));
toXSpak.addEventListener("input", getDataSelectionHandler("x", "to"));
toYSpak.addEventListener("input", getDataSelectionHandler("y", "to"));

const oppdaterSpaker = (bildeInfo) => {
    const {
        height,
        width,
        selection: {
            x: {
                from: fromX,
                to: toX
            } = {},
            y: {
                from: fromY,
                to: toY
            } = {}
        }
    } = bildeInfo;

    fromXSpak.max = width;
    fromXSpak.value = fromX;
    fromYSpak.max = height;
    fromYSpak.value = fromY;

    toXSpak.max = width;
    toXSpak.value = toX;
    toYSpak.max = height;
    toYSpak.value = toY;

};

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

const kB = 1024;
const mB = 1024 * kB;
const gB = 1024 * mB;
const tB = 1024 * gB;

const lesbarFilstorrelse = (bytes) => {
    const tBSize = bytes / tB;
    if (tBSize >= 0.5) {
        return `${tBSize.toPrecision(3)} TB`;
    }
    const gBSize = bytes / gB;
    if (gBSize >= 0.5) {
        return `${gBSize.toPrecision(3)} GB`;
    }
    const mBSize = bytes / mB;
    if (mBSize >= 0.5) {
        return `${mBSize.toPrecision(3)} MB`;
    }
    const kBSize = bytes / kB;
    if (kBSize >= 0.5) {
        return `${kBSize.toPrecision(3)} kB`;
    }

    return `${bytes} byte`;

};

const visBildeIDokumentet = (bilde, metadata = {}) => {
    const billedliste = document.getElementById("innlastede-bilder-liste");
    const now = Date.now();

    const {
        name = "",
        size = 0,
        lastModified = now
    } = metadata;
    /*
        Resten av koden i denne funksjonen er langtekkelig og tung å lese
        derfor finnes det en hel del kodebibliotek som oversetter mer lettlest notasjon til lignende kode.
        Selv om noen av disse notasjonene er mer utbredt enn andre, finnes det ingen standard for det,
        så man står alltid i fare for å måtte skrive om koden hvis de som vedlikeholder biblioteket man
        har brukt mister interessen for det.
    */

    const id = metadataToString({size, lastModified, name});

    const listeElement = document.createElement("li");
    listeElement.id = id;
    const lenke = document.createElement("a");
    lenke.href = `#${id}`;
    listeElement.appendChild(lenke);

    const figur = document.createElement("figure");
    lenke.appendChild(figur);

    figur.appendChild(bilde);
    if (name !== "" || size !== 0 || lastModified !== now) {
        const billedtekst = document.createElement("figcaption");
        const egenskaper = document.createElement("dl");

        if (name !== "") {
            leggTilEgenskap("filnavn", name, egenskaper);
        }
        if (lastModified !== now) {
            const tidspunkt = document.createElement("time");
            const datoObjekt = new Date(lastModified);
            const iso = datoObjekt.toISOString();
            tidspunkt.datetime = iso;
            tidspunkt.title = iso;
            tidspunkt.innerText = iso.split("T")[0];
            leggTilEgenskap("endret", tidspunkt, egenskaper);
        }
        if (size !== 0) {
            const storrelse = document.createElement("span");
            storrelse.title = `${size} bytes`;
            storrelse.innerText = lesbarFilstorrelse(size);
            leggTilEgenskap("størrelse", storrelse, egenskaper);
        }

        billedtekst.appendChild(egenskaper);
        figur.appendChild(billedtekst);
    }

    const fjerneknapp = document.createElement("button");
    fjerneknapp.innerText = `fjern ${name}`;
    fjerneknapp.title = `fjern ${name}`;
    fjerneknapp.value = id;
    listeElement.appendChild(fjerneknapp);

    billedliste.appendChild(listeElement);

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
    visBildeIDokumentet(image, metadata);
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
        })
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

    // canvasCtx.putImageData(piksler, 0, 0);

const fromFreqInput = document.getElementById("from-freq");
const toFreqInput = document.getElementById("to-freq");
const scaleLengthInput = document.getElementById("skalatrinn");
const scaleTypeExpInput = document.getElementById("scale-type-exp");
const scaleTypeLinInput = document.getElementById("scale-type-lin");
const testvolumInput = document.getElementById("testvolum");


const getScaleFunction = (fromFreq, toFreq, steps, type = "exp") => {
    if (type === "exp") {
        const ratio = (toFreq / fromFreq);
        return step => fromFreq * Math.pow(ratio, (step / (steps - 1)));
    }
    if (steps > 1) {
        const stepDiff = (toFreq - fromFreq) / (steps - 1);
        return step => fromFreq + stepDiff * step;
    }
    const halfway = toFreq + (toFreq - fromFreq) / 2;
    return () => halfway;
};

let fromFreq = parseFloat(fromFreqInput.value);
let toFreq = parseFloat(toFreqInput.value);
let scaleLength = parseInt(scaleLengthInput.value, 10);
let testvolum = parseFloat(testvolumInput.value);
let scaleType = "exp";

const updateScaleFn = () => {
    scaleFn = getScaleFunction(fromFreq, toFreq, scaleLength, scaleType);
};

const disconnectSource = ({oscillator, gain}) => {
    oscillator.stop();
    oscillator.disconnect();
    gain.disconnect();
};

const getSource = (audioContext, destination = null) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    if (destination !== null) {
        gain.connect(destination);
    }

    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(testvolum, audioContext.currentTime + 0.2);

    oscillator.start();

    return {
        oscillator,
        gain
    };
};

const updateSourceCount = (sources = [], count = 0) => {
    while (sources.length > count) {
        const source = sources.pop();
        source.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        setTimeout(disconnectSource, 200, source);
    }

    while (sources.length < count) {
        sources.push(getSource(audioContext, summingAttenuator));
    }

    if (sources.length !== 0) {
        summingAttenuator.gain.setValueAtTime(1 / sources.length, audioContext.currentTime);
    }
};

const updateFrequencies = (scaleFn, sources = []) => {
    if (audioContext) {
        sources.forEach(({oscillator}, i) => {
            const f = scaleFn(i);
            console.log(f);
            oscillator.frequency.setValueAtTime(f, audioContext.currentTime);
        });
    }
};



const fromFreqHandler = (event) => {
    fromFreq = parseFloat(event.target.value);
    updateScaleFn();
    updateFrequencies(scaleFn, sources);
};

const toFreqHandler = (event) => {
    toFreq = parseFloat(event.target.value);
    updateScaleFn();
    updateFrequencies(scaleFn, sources);
};

const scaleLengthHandler = event => {
    scaleLength = parseInt(event.target.value);
    updateScaleFn();
    updateSourceCount(sources, scaleLength);
    updateFrequencies(scaleFn, sources);
};

const scaleTypeHandler = event => {
    console.log(event.target.value);
    scaleType = event.target.value;
    updateScaleFn();
    updateFrequencies(scaleFn, sources);
};

const testvolumHandler = (event) => {
    testvolum = parseFloat(event.target.value);

    sources.forEach((source, i) => {
        source.gain.gain.setValueAtTime(testvolum, audioContext.currentTime);
    });
};

fromFreqInput.addEventListener("input", fromFreqHandler);
toFreqInput.addEventListener("input", toFreqHandler);
scaleLengthInput.addEventListener("input", scaleLengthHandler);
scaleTypeLinInput.addEventListener("input", scaleTypeHandler);
scaleTypeExpInput.addEventListener("input", scaleTypeHandler);

testvolumInput.addEventListener("input", testvolumHandler);




/* funksjon som oppretter en audioContext og aktiver den, til å kjøres én gang, etter første brukerinteraksjon. ("bli lyd!"-knappen) */

/*
    I Javascript kan funksjonsdeklarasjoner skrives på to måter.
    Legg merke til at deklarasjonene ikke sier noe om hvilken datatype funksjonen returnerer,
    eller om den returnerer noe i det hele tatt,
    til forskjell fra typede språk og språk som skiller mellom funksjoner (som returnerer noe) og metoder.
    Dette er den opprinnelige måten:
*/

function bliLyd (event) {
    audioContext = new AudioContext();
    summingAttenuator = audioContext.createGain();
    summingAttenuator.connect(audioContext.destination);
    updateScaleFn();
    updateSourceCount(sources, scaleLength);
    updateFrequencies(scaleFn, sources);
}

const generatortest = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (bilder[aktivtBildeIndeks]) {
        const {
            selection: {
                x: {
                    from: fromX = 0,
                    to: toX = 1
                } = {},
                y: {
                    from: fromY = 0,
                    to: toY = 100
                } = {}
            } = {}
        } = bilder[aktivtBildeIndeks] || {};

        if (event.submitter.value === "generatortest") {
            columnFn = columnFn || getColumnFn(canvasCtx, fromX, toX, fromY, toY);
            console.log(getColumnData(columnFn(0)));
        }
    }
};

const generatorskjema = document.getElementById("generatorskjema");
generatorskjema.addEventListener("submit", generatortest);
