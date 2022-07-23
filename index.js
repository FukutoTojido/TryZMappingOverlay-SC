// START
let socket = CreateProxiedReconnectingWebSocket(
    "ws://${window.overlay.config.host}:${window.overlay.config.port}/ws"
);
let socket2 = new ReconnectingWebSocket("ws://localhost:20727/tokens", null, {
    debug: true,
    reconnectInterval: 3000,
});

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket2.onopen = (event) => {
    let initdata = [
        "circles",
        "sliders",
        "spinners",
        "bpm",
        "simulatedPp",
        "osu_SSPP",
        "osu_99PP",
        "osu_98PP",
        "osu_97PP",
        "osu_96PP",
        "osu_95PP",
    ];
    console.log("Tokens Accessed");
    socket2.send(JSON.stringify(initdata)); // send init data.
};

socket.onclose = (event) => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = (error) => {
    console.log("Socket Error: ", error);
};

let mapid = document.getElementById("mapid");
let mapBG = document.getElementById("mapBG");

// NOW PLAYING
let mapContainer = document.getElementById("nowPlayingContainer");

let globalColor;
let graphRaw;

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

let animation = {
    currentSR: new CountUp("currentSR", 0, 0, 2, 0.2, {
        useEasing: true,
        useGrouping: true,
        separator: " ",
        decimal: ".",
    }),
    maxSR: new CountUp("maxSR", 0, 0, 2, 0.2, {
        useEasing: true,
        useGrouping: true,
        separator: " ",
        decimal: ".",
        suffix: "⭐",
    }),
    ppNow: new CountUp("ppNow", 0, 0, 0, 0.2, {
        useEasing: true,
        useGrouping: true,
        separator: " ",
        decimal: ".",
        prefix: "Now: ",
        suffix: "pp",
    }),
};
let gameState;

let tempMapID,
    tempImg,
    tempMapArtist,
    tempMapTitle,
    tempMapDiff,
    tempMapper,
    tempRankedStatus;

let tempSR, tempFullSR, tempCS, tempAR, tempOD, tempHPDr, tempBPM;
let tempPP;

let tempCircles, tempSliders, tempSpinners;

let tempTimeCurrent;
let tempTimeFull;
let tempFirstObj;
let tempTimeMP3;

let tempStrainBase;
let smoothOffset = 2;
let seek;
let fullTime;

let tempPPData = {
    temp100: 0,
    temp99: 0,
    temp98: 0,
    temp97: 0,
    temp96: 0,
    temp95: 0,
};

window.onload = function () {
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = new Chart(ctx, config);

    // var ctxSecond = document.getElementById("canvasSecond").getContext("2d");
    // window.myLineSecond = new Chart(ctxSecond, configSecond);
};

let trigger = false;

socket2.onmessage = (event) => {
    let data = JSON.parse(event.data);

    // if (trigger === false) {
    //     console.log(data)
    //     trigger = true;
    // }

    if (tempBPM !== data.bpm) {
        if (data.bpm !== undefined) {
            tempBPM = data.bpm;
            BPM.innerHTML = `BPM: ${tempBPM}`;
        }
    }

    if (tempPP !== data.simulatedPp && data.simulatedPp !== undefined) {
        tempPP = data.simulatedPp;
        ppNow.innerHTML = tempPP;
        animation.ppNow.update(ppNow.innerHTML);
    }

    for (let i = 0; i < 6; i++)
        if (
            tempPPData[`temp${100 - i}`] !==
                data[`osu_${i === 0 ? "SS" : 100 - i}PP`] &&
            data[`osu_${i === 0 ? "SS" : 100 - i}PP`] !== undefined
        ) {
            tempPPData[`temp${100 - i}`] =
                data[`osu_${i === 0 ? "SS" : 100 - i}PP`];
            document.getElementById(`pp${100 - i}`).innerHTML = `${
                100 - i
            }%: ${Math.round(tempPPData["temp" + (100 - i)])}pp`;
        }

    if (tempCircles !== data.circles && data.circles !== undefined) {
        circles.innerHTML = `${data.circles}x`;
    }

    if (tempSliders !== data.circles && data.sliders !== undefined) {
        sliders.innerHTML = `${data.sliders}x`;
    }

    if (tempSpinners !== data.circles && data.spinners !== undefined) {
        spinners.innerHTML = `${data.spinners}x`;
    }
};

socket.onmessage = (event) => {
    let data = event.data;

    // if (trigger === false) {
    //     console.log(event.data)
    //     trigger = true;
    // }

    if (tempImg !== data.menu.bm.path.full) {
        tempImg = data.menu.bm.path.full;
        data.menu.bm.path.full = data.menu.bm.path.full
            .replace(/#/g, "%23")
            .replace(/%/g, "%25")
            .replace(/\\/g, "/")
            .replace(/'/g, "%27");

        // mapBG.style.backgroundImage = `url('http://${
        //     window.overlay.config.host
        // }:${window.overlay.config.port}/Songs/${
        //     data.menu.bm.path.full
        // }?a=${Math.random(10000)}')`;
        mapThumb.style.backgroundImage = `url('http://${
            window.overlay.config.host
        }:${window.overlay.config.port}/Songs/${
            data.menu.bm.path.full
        }?a=${Math.random(10000)}')`;
        mapContainer.style.backgroundPosition = "50% 50%";
    }

    if (gameState !== data.menu.state) {
        gameState = data.menu.state;
        middle.style.opacity = 1 * (gameState === 1) + 0;
        // mapBG.style.opacity = 1 * (gameState === 1) + 0;
        // mapBGOverlay.style.opacity = 1 * (gameState === 1) + 0;
        strainLine.style.opacity = 1 * (gameState === 1) + 0;
        strainGraph.style.opacity = 1 * (gameState === 1) + 0;
        objectsCounter.style.opacity = 1 * (gameState === 1) + 0;
    }

    if (
        tempMapID !== data.menu.bm.id ||
        tempMapDiff !== `[${data.menu.bm.metadata.difficulty}]`
    ) {
        tempMapID = data.menu.bm.id;
        tempMapArtist = `<span style="font-size: 12px; font-weight: 100">${data.menu.bm.metadata.artist}</span>`;
        tempMapTitle = data.menu.bm.metadata.title;
        tempMapDiff = "[" + data.menu.bm.metadata.difficulty + "]";

        mapName.innerHTML = tempMapArtist + "<br>" + tempMapTitle;
        mapInfo.innerHTML = `${tempMapDiff}`;
    }

    if (tempCS !== data.menu.bm.stats.CS) {
        tempCS = data.menu.bm.stats.CS;
        CS.innerHTML = `CS: ${tempCS}`;
    }
    if (tempAR !== data.menu.bm.stats.AR) {
        tempAR = data.menu.bm.stats.AR;
        AR.innerHTML = `AR: ${tempAR}`;
    }
    if (tempOD !== data.menu.bm.stats.OD) {
        tempOD = data.menu.bm.stats.OD;
        OD.innerHTML = `OD: ${tempOD}`;
    }
    if (tempHPDr !== data.menu.bm.stats.HP) {
        tempHPDr = data.menu.bm.stats.HP;
        HP.innerHTML = `HP: ${tempHPDr}`;
    }
    if (tempSR !== data.menu.bm.stats.SR) {
        tempSR = data.menu.bm.stats.SR;
        currentSR.innerHTML = tempSR;
        animation.currentSR.update(currentSR.innerHTML);
    }
    if (tempFullSR !== data.menu.bm.stats.fullSR) {
        tempFullSR = data.menu.bm.stats.fullSR;
        maxSR.innerHTML = tempFullSR;
        animation.maxSR.update(maxSR.innerHTML);
    }

    if (fullTime !== data.menu.bm.time.mp3) {
        fullTime = data.menu.bm.time.mp3;
        onepart = 1700 / fullTime;
    }

    if (
        tempStrainBase !==
        JSON.stringify(reduceArray(Object.values(data.menu.pp.strains), 100))
    ) {
        graphRaw = reduceArray(Object.values(data.menu.pp.strains), 100);
        tempLink = JSON.stringify(
            reduceArray(Object.values(data.menu.pp.strains), 100)
        );
        if (Object.values(data.menu.pp.strains))
            smoothed = smooth(graphRaw, smoothOffset);
        // config.data.datasets[0].data = smoothed;
        config.data.datasets[0].data = graphRaw;
        // config.data.datasets[0].backgroundColor = `rgba(${colorGet.r}, ${colorGet.g}, ${colorGet.b}, 0.2)`;
        config.data.labels = graphRaw;
        // configSecond.data.datasets[0].data = smoothed;
        // configSecond.data.datasets[0].backgroundColor = `rgba(${colorGet.r}, ${colorGet.g}, ${colorGet.b}, 0.7)`;
        // configSecond.data.labels = smoothed;
        if (window.myLine) {
            window.myLine.update();
            // window.myLineSecond.update();
        }
    }
    if (
        seek !== data.menu.bm.time.current &&
        fullTime !== undefined &&
        fullTime !== 0
    ) {
        seek = data.menu.bm.time.current;
        timeElapsed.innerHTML = seek < 0 ? 0 : millisToMinutesAndSeconds(seek);
        timeLeft.innerHTML =
            seek >= fullTime
                ? "-0:00"
                : "-" + millisToMinutesAndSeconds(fullTime - seek);
        progressBar.style.width =
            seek >= fullTime ? "1700px" : onepart * seek + "px";
    }

    if (tempTimeCurrent !== data.menu.bm.time.current) {
        tempTimeCurrent = data.menu.bm.time.current;
        tempTimeFull = data.menu.bm.time.full;
        tempTimeMP3 = data.menu.bm.time.mp3;
        interfaceID = data.settings.showInterface;
    }
};

let config = {
    type: "bar",
    data: {
        labels: [],
        datasets: [
            {
                // borderColor: "rgba(255, 255, 255, 0)",
                // backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderWidth: "0",
                backgroundColor(c) {
                    let alpha =
                        (c.dataset.data[c.dataIndex] /
                            Math.max.apply(null, graphRaw)) *
                        0.6;
                    // console.log(alpha);
                    return `rgba(255, 255, 255, ${alpha})`;
                },
                data: [],
                fill: true,
                minBarLength: 100,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            },
        ],
    },
    options: {
        tooltips: { enabled: false },
        legend: {
            display: false,
        },
        responsive: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            },
        },
    },
};

let configSecond = {
    type: "bar",
    data: {
        labels: [],
        datasets: [
            {
                borderColor: "rgba(0, 0, 0, 0)",
                borderWidth: "0",
                backgroundColor: "rgba(255, 255, 255, 1)",
                data: [],
                fill: true,
                minBarLength: 100,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            },
        ],
    },
    options: {
        tooltips: { enabled: false },
        legend: {
            display: false,
        },
        // elements: {
        //     line: {
        //         tension: 0.4,
        //         cubicInterpolationMode: "monotone",
        //     },
        //     point: {
        //         radius: 0,
        //     },
        // },
        responsive: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            },
        },
    },
};

function reduceArray(array, newSize) {
    const returnArray = [];
    const valuesToSum = array.length / newSize;
    for (let i = 0; i < array.length; i += valuesToSum) {
        let sum = 0;
        let j;
        let start_i = Math.floor(i);
        for (
            j = start_i;
            j < Math.min(start_i + valuesToSum, array.length);
            j++
        ) {
            sum += array[j];
        }
        returnArray.push(sum / (j - start_i));
    }
    return returnArray;
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return seconds == 60
        ? minutes + 1 + ":00"
        : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
