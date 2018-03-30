var plotSizeX;
var plotSizeY;
var unitSize;
var floors;  
var wraparound;
var ruleset;
var coreCellList = [];

var initialGenerationSet = false;

var cellColors = {
    0: '',
    1: '#16a085',
    2: '#2ecc71',
    3: '#16a085',
    4: '#e67e22',
    5: '#d35400',
};

var sketch = function(p) {
    let mainWindow;
    let canvasSizeX;
    let canvasSizeY;

    let mainWindowPadding;
    let _top;
    let _left;
    let _right;
    let _bottom;
    let gridTopLeft;

    let gridRows;
    let gridCols;

    let renderType = '3D';
    let layerDrawTimer;

    var automaton = new CellularAutomaton();

    var easycam;

    let inputs = {
        'plotWidth': null,
        'plotLength': null,
        'unitSize': null,
        'coreCells': null,
        'floors': null,
        'minFloorFill': null,
        'minVolFill': null,
        'wraparound': false,
        'ruleset': false
    }

    let buttons = {
        'setInitial': null,
        'propagate': null
    }

    p.setup = function() {
        p.pixelDensity(1);

        mainWindow = document.getElementById('main-window');
        canvasSizeX = mainWindow.clientWidth-3;
        canvasSizeY = mainWindow.clientHeight-3;

        let canvas = p.createCanvas(canvasSizeX, canvasSizeY, p.WEBGL);
        p.setAttributes('antialiasing', true);

        easycam = p.createEasyCam(
            {
                distance: 1200, 
                center: [0, 0, 300],
                rotation: [-0.73657645671131, -0.473425444805009, 0.22421945906390903, -0.4278423843039303],
            }
        );

        //easycam.removeMouseListeners();
        easycam.setDistanceMin(500);
        easycam.setDistanceMax(2500);

        inputs['plotWidth'] = document.getElementById('inputPlotWidth');
        inputs['plotLength'] = document.getElementById('inputPlotLength');
        inputs['unitSize'] = document.getElementById('inputUnitSize');
        inputs['coreCells'] = document.getElementById('inputCoreCells');
        inputs['floors'] = document.getElementById('inputFloors');
        inputs['wraparound'] = document.getElementById('inputWraparound');
        inputs['ruleset'] = document.getElementById('buttonRuleset');

        for (let i = 0; i < automaton.rulesets.length; i++) {
            $("#dropdownRuleset").append('<button class="dropdown-item btn-sm" value="' + i + '">' + automaton.rulesets[i] + '</button>');
        }
        
        $("#dropdownRuleset button").click( function(e) {
            e.preventDefault(); // cancel the link behaviour
            var selText = $(this).text();
            $("#buttonRuleset").text(selText);
        });

        buttons['setInitial'] = document.getElementById('buttonSetInitial');
        buttons['propagate'] = document.getElementById('buttonPropagate');

        buttons['setInitial'].onclick = setInitialParameters;
        buttons['propagate'].onclick = propagate;

        mainWindowPadding = canvasSizeY/10;
        _top = 0 - canvasSizeY/2;
        _left = 0 - canvasSizeX/2;
        _right = 0 + canvasSizeX/2;
        _bottom = 0 + canvasSizeY/2;
    }

    p.windowResized = function() {
        canvasSizeX = mainWindow.clientWidth-3;
        canvasSizeY = mainWindow.clientHeight-3;

        p.resizeCanvas(canvasSizeX, canvasSizeY);
        easycam.setViewport([0,0,windowWidth, windowHeight]);

        mainWindowPadding = canvasSizeY/10;
        _top = 0 - canvasSizeY/2;
        _left = 0 - canvasSizeX/2;
        _right = 0 + canvasSizeX/2;
        _bottom = 0 + canvasSizeY/2;

        gridTopLeft = set(
            (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
            (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
            scaledUnitSize/2
        );
    }

    p.draw = function() {
        drawUI();
        setLights();
        drawGrid();

        if (automaton.generations.length > 0) drawLayers(automaton.generations);
        if (automaton.generations.length === floors) clearInterval(layerDrawTimer);
    }

    p.mouseWheel = function(event) {
        return false;
    }

    function drawUI() {
        // set background color
        p.background('#34495e');
    }

    function setLights() {
        p.pointLight(255, 255, 255, 2*_left, 2*_top, 500);
        p.pointLight(255, 255, 255, 2*_right, 2*_top, 500);
        p.pointLight(255, 255, 255, 2*_right, 2*_bottom, 500);
        p.pointLight(255, 255, 255, 2*_left, 2*_bottom, 500);

        p.pointLight(255, 255, 255, 0, 0, 15000);
    }

    function cameraHandler() {
        this.state = {
            x: 0,
            y: (p.height / 2) / (p.tan(p.PI / 6)),
            z: 0,
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            upX: 0,
            upY: 1,
            upZ: 0,
        }

        this.zoomScale = 2;

        this.setInitial = function(x, y, z, centerX, centerY, centerZ, upX, upY, upZ) {
            this.state.x = x;
            this.state.y = y;
            this.state.z = z;
            this.state.centerX = centerX;
            this.state.centerY = centerY;
            this.state.centerZ = centerZ;
            this.state.upX = upX;
            this.state.upY = upY;
            this.state.upZ = upZ;
        }

        this.zoom = function(magnitude) {

        }

        this.reset()
    }

    function setInitialParameters() {
        clearInterval(layerDrawTimer);

        plotSizeX = parseInt(inputs['plotWidth'].value);
        plotSizeY = parseInt(inputs['plotLength'].value);
        unitSize = parseInt(inputs['unitSize'].value);

        if (inputs['coreCells'].value.length !== 0) {
            coreCellList = inputs['coreCells'].value.replace(/\s/g, '').replace(/\)\,/g, ')\n').split('\n');
            
            for (var i = 0; i < coreCellList.length; i++) {
                coreCellList[i] = coreCellList[i].match(/\(([^)]+)\)/)[1].split(',');
    
                for (var j =0; j < coreCellList[i].length; j++) {
                    coreCellList[i][j] = parseInt(coreCellList[i][j]);
                }
            }
        }

        let scale = ((((canvasSizeX - mainWindowPadding*2)/plotSizeX) < ((canvasSizeY - mainWindowPadding*2)/plotSizeY)) ? 
                    ((canvasSizeX - mainWindowPadding*2)/plotSizeX) : ((canvasSizeY - mainWindowPadding*2)/plotSizeY));

        scaledPlotSizeX = plotSizeX * scale;
        scaledPlotSizeY = plotSizeY * scale;
        scaledUnitSize = unitSize * scale;

        gridTopLeft = p.createVector(
            (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
            (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
            scaledUnitSize/2
        );

        gridRows = plotSizeX / unitSize;
        gridCols = plotSizeY / unitSize;

        let initialGeneration = new Array(gridRows);
        for (let i = 0; i < initialGeneration.length; i++) {
            initialGeneration[i] = new Array(gridCols);
        }

        // office-residence
        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                if (p.floor(p.random(2)) == 1) {
                    initialGeneration[i][j] = 4;
                }
                else {
                    initialGeneration[i][j] = 0;
                }
            }
        }

        for (let i = 0; i < coreCellList.length; i++) {
            initialGeneration[coreCellList[i][0] - 1][coreCellList[i][1] - 1] = 5;
        }

        automaton.initialise(gridRows, gridCols, false);
        automaton.setInitialGeneration(initialGeneration);
        buttons['propagate'].value = 'Propagate';
        initialGenerationSet = true;
    }

    function propagate() {
        if (initialGenerationSet === false) {
            showAlert('danger', 'Set the initial generation first!');
        }
        else if ($("#buttonRuleset").text().indexOf('Select Ruleset') !== -1) {
            showAlert('danger', 'Select the ruleset first!');
        }
        else if (buttons['propagate'].value === 'Propagate') {
            buttons['propagate'].value = 'Reset';

            floors = parseInt(inputs['floors'].value);
            wraparound = inputs['wraparound'].checked;
            ruleset = $("#buttonRuleset").text();
            
            automaton.setWraparound(wraparound);
            automaton.setRuleset(ruleset);
            layerDrawTimer = setInterval(function() {automaton.computeNextGeneration()}, 100);
        }
        else if (buttons['propagate'].value === 'Reset') {
            buttons['propagate'].value = 'Propagate';

            automaton.reset();
        }
    }

    function showAlert(type, message) {
        $("#divAlertMessage").removeClass( function (index, className) {
            return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
        });
        $("#divAlertMessage").addClass('alert-' + type)
        
        $("#divAlertMessage").text(message);
        $("#divAlertMessage").fadeTo(2000, 500).slideUp(500, function(){
            $("#divAlertMessage").slideUp(500);
        });
    }

    function drawGrid() {
        p.stroke('#7f8c8d');
        p.strokeWeight(2);

        for (let i = 0; i < gridRows + 1; i++) {
            let x = i * scaledUnitSize;

            p.line((_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 - scaledPlotSizeY/2 - mainWindowPadding/2, 
                    (_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 + scaledPlotSizeY/2 + mainWindowPadding/2);
        }

        for (let j = 0; j < gridCols + 1; j++) {
            let y = j * scaledUnitSize;

            p.line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                    (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);
        }
    }

    function drawLayers(generations, layerStart, layerEnd) {
        if (typeof(layerStart) === 'undefined') layerStart = 0;
        if (typeof(layerEnd) === 'undefined') layerEnd = generations.length;

        p.translate(gridTopLeft.x, gridTopLeft.y, gridTopLeft.z + (scaledUnitSize * layerStart));

        for (let layer = layerStart; layer < layerEnd; layer++) {
            for (let i = 0; i < gridRows; i++) {
                for (let j = 0; j < gridCols; j++) {
                    if (generations[layer][i][j] !== 0) {
                        p.ambientMaterial(cellColors[generations[layer][i][j]]);
                        p.box(scaledUnitSize);
                    }
                    p.translate(0, scaledUnitSize, 0);
                }
                p.translate(scaledUnitSize, -gridCols * scaledUnitSize, 0);
            }
            p.translate(-gridRows * scaledUnitSize, 0, scaledUnitSize);
        }
    }
}

new p5(sketch, 'main-window');