let context;
let omhyler;
let oscillator;

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

