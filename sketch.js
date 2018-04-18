var plotSizeX;
var plotSizeY;
var unitSize;
var floors;  
var wraparound;
var ruleset;
var buildingParameters = {};
var propogationParameters = {};
var customRuleset = {};

var initialGenerationSet = false;

let scrollLock = true;

var cellColors = {
    0: '',          // dead
    1: '#16a085',   // basic
    2: '#f1c40f',   // residence
    3: '#f39c12',   // residence-core
    4: '#3498db',   // office
    5: '#2980b9',   // office-core
    6: '#e74c3c',   // commercial
    7: '#c0392b',   // commercial-core
    8: '#9b59b6',   // cultural
    9: '#8e44ad',   // cultural-core
};

var cellIndicators = {
    'generic': [0, 1],
    'residence': [2, 3],
    'office': [4, 5],
    'commercial': [6, 7],
    'cultural': [8, 9],
}

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

    var scaledPlotSizeX;
    var scaledPlotSizeY;
    var scaledUnitSize;

    var cellXYScale = 1;
    var cellZScale = 1;

    let gridRows;
    let gridCols;
    var canvas;

    let renderType = '3D';
    let layerDrawTimer;

    var automaton = new CellularAutomaton();

    var renderedLayerStart = 0;
    var renderedLayerEnd = 1;

    var renderCellOutline = true;

    var easycam;

    let inputs = {};
    let buttons = {};

    let defaultBuildingParameters;
    let invertedPropogation = false;

    let _generations;

    let verticalLines = [];
    let horizontalLines = [];

    let initialGenerationChoices = [
        'random',
        'manual',
    ]

    let manualInitialGeneration;

    p.setup = function() {
        p.pixelDensity(1);

        mainWindow = document.getElementById('main-window');
        canvasSizeX = mainWindow.clientWidth-3;
        canvasSizeY = mainWindow.clientHeight-3;

        canvas = p.createCanvas(canvasSizeX, canvasSizeY, p.WEBGL);
        p.setAttributes('antialiasing', true);

        easycam = p.createEasyCam(
            {
                distance: 1200, 
                center: [0, 0, 350],
                rotation: [0.373774147330301, 0.2267155863804119, 0.4680836446901702, -0.7679782752482324],
                //rotation: [0.5, 0.5, 0.5, -0.5],
            }
        );

        easycam.setDistanceMin(500);
        easycam.setDistanceMax(2500);

        inputs['plotWidth'] = document.getElementById('inputPlotWidth');
        inputs['plotLength'] = document.getElementById('inputPlotLength');
        inputs['unitSize'] = document.getElementById('inputUnitSize');
        inputs['floors'] = document.getElementById('inputFloors');
        inputs['wraparound'] = document.getElementById('inputWraparound');
        inputs['singleFloor'] = document.getElementById('inputSingleFloor');
        inputs['cellTypes'] = document.getElementById('inputCellTypes');
        inputs['coreCells'] = document.getElementById('inputCoreCells');
        inputs['deadCells'] = document.getElementById('inputDeadCells');
        inputs['birthConditions'] = document.getElementById('inputBirthConditions');
        inputs['deathConditions'] = document.getElementById('inputDeathConditions');
        inputs['cellOutline'] = document.getElementById('inputCellOutline');
        inputs['floorFill'] = document.getElementById('inputFloorFill');
        inputs['invertedPropogation'] = document.getElementById('inputInvertedPropogation');

        buttons['setInitial'] = document.getElementById('buttonSetInitial');
        buttons['propagate'] = document.getElementById('buttonPropagate');
        buttons['exportLayers'] = document.getElementById('buttonExportLayers');
        buttons['exportCAD'] = document.getElementById('buttonExportCAD');
        buttons['saveBuildingParameters'] = document.getElementById('buttonSaveBuildingParameters');
        buttons['saveCustomRuleset'] = document.getElementById('buttonSaveCustomRuleset');
        buttons['setGrid'] = document.getElementById('buttonSetGrid');

        buttons['setInitial'].onclick = setInitialParameters;
        buttons['propagate'].onclick = propagate;
        buttons['exportLayers'].onclick = exportLayers;
        buttons['exportCAD'].onclick = exportCAD;
        buttons['saveBuildingParameters'].onclick = saveBuildingParameters;
        buttons['saveCustomRuleset'].onclick = saveCustomRuleset;
        buttons['setGrid'].onclick = setGrid;

        for (let i = 0; i < automaton.rulesets.length; i++) {
            $("#dropdownRuleset").append('<button class="dropdown-item btn-sm" value="' + i + '">' + automaton.rulesets[i] + '</button>');
        }
        
        $("#dropdownRuleset button").click( function(e) {
            e.preventDefault(); // cancel the link behaviour
            var selText = $(this).text();
            $("#buttonRuleset").text(selText);

            if (selText === 'custom') {
                $("#buttonSetCustomRuleset").prop('disabled', false);
            }
            else {
                $("#buttonSetCustomRuleset").prop('disabled', true);
            }
        });

        for (let i = 0; i < initialGenerationChoices.length; i++) {
            $("#dropdownInitialGeneration").append('<button class="dropdown-item btn-sm" value="' + i + '">' + initialGenerationChoices[i] + '</button>');
        }

        $("#dropdownInitialGeneration button").click( function(e) {
            e.preventDefault(); // cancel the link behaviour
            var selText = $(this).text();
            $("#buttonInitialGeneration").text(selText);
        });

        $('#buttonExportLayers').prop('disabled', true);

        $('#buildingParametersModal').on('hidden.bs.modal', function (e) {
            scrollLock = true;
        });

        $('#buildingParametersModal').on('shown.bs.modal', function (e) {
            scrollLock = false;
        });

        $("#menu").hover(
            function() {
                scrollLock = false;
            },
            function() {
                scrollLock = true;
         });

        $('#floorSlider').bootstrapSlider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        });

        $('#floorSlider').on("slide", function(slideEvt) {
            $("#floorSliderValue").text("Floor: " + slideEvt.value);
            renderedLayerEnd = slideEvt.value;
        });

        $('#inputInvertedPropogation').click(function() {
            if (this.checked) invertedPropogation = true;
            else invertedPropogation = false;
        });

        $('#inputSingleFloor').click(function() {
            if (this.checked) renderedLayerStart = -1;
            else renderedLayerStart = 0;
        });

        $('#inputCellOutline').click(function() {
            if (this.checked) renderCellOutline = true;
            else renderCellOutline = false;
        });

        $('#cellXYScaleSlider').bootstrapSlider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        });

        $('#cellXYScaleSlider').on("slide", function(slideEvt) {
            $("#cellXYScaleValue").text("Cell XY Scale: " + slideEvt.value.toPrecision(2) + 'x');
            cellXYScale = slideEvt.value.toPrecision(2);
        });

        $('#cellZScaleSlider').bootstrapSlider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        });

        $('#cellZScaleSlider').on("slide", function(slideEvt) {
            $("#cellZScaleValue").text("Cell Z Scale: " + slideEvt.value.toPrecision(2) + 'x');
            cellZScale = slideEvt.value.toPrecision(2);
        });

        saveBuildingParameters();
        defaultBuildingParameters = buildingParameters;

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
        easycam.setViewport([0, 0, p.windowWidth, p.windowHeight]);

        mainWindowPadding = canvasSizeY/10;
        _top = 0 - canvasSizeY/2;
        _left = 0 - canvasSizeX/2;
        _right = 0 + canvasSizeX/2;
        _bottom = 0 + canvasSizeY/2;

        if (initialGenerationSet) {
            gridTopLeft = p.createVector(
                (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
                (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
                scaledUnitSize/2
            );
        }
    }

    p.draw = function() {
        drawUI();
        setLights();
        drawGrid();

        setGridParameters();

        if (automaton.generations.length > 0) drawLayers(automaton.generations, renderedLayerStart, renderedLayerEnd);
        if (automaton.generations.length === floors) clearInterval(layerDrawTimer);
    }

    p.mouseWheel = function(event) {
        return !scrollLock;
    }

    function drawUI() {
        // set background color
        p.background('#F5F5F5');
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

    function setGridParameters() {
        plotSizeX = parseInt(inputs['plotWidth'].value);
        plotSizeY = parseInt(inputs['plotLength'].value);
        unitSize = parseInt(inputs['unitSize'].value);

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
    }

    function setGrid() {
        automaton.initialise(gridRows, gridCols, false);
        
        if (buttons['setGrid'].value === 'Set Grid') {
            buttons['setGrid'].value = 'Reset Grid';

            $('#inputPlotWidth').prop('disabled', true);
            $('#inputPlotLength').prop('disabled', true);
            $('#inputUnitSize').prop('disabled', true);

            $('#buttonSetInitial').prop('disabled', false);
        }
        else if (buttons['setGrid'].value === 'Reset Grid') {
            buttons['setGrid'].value = 'Set Grid';

            $('#inputPlotWidth').prop('disabled', false);
            $('#inputPlotLength').prop('disabled', false);
            $('#inputUnitSize').prop('disabled', false);

            $('#buttonSetInitial').prop('disabled', true);
            $('#buttonPropagate').prop('disabled', true);
        }
    }

    function setInitialParameters() {
        if (buttons['setInitial'].value === 'Set Initial Parameters') {
            if (saveBuildingParameters() === -1) {
                showAlert('danger', 'Please fix the building parameters.')
                return false;
            }
            buttons['setInitial'].value = 'Change Initial Parameters';
            buttons['propagate'].value = 'Propagate';
            clearInterval(layerDrawTimer);

            $('#floorSlider').bootstrapSlider({max: 1, value: 1});
            $('#floorSlider').bootstrapSlider("disable");
            $('#buttonExportLayers').prop('disabled', true);
            $('#buttonExportCAD').prop('disabled', true);
            $('#buttonSetBuildingParameters').prop('disabled', true);
            $('#inputInvertedPropogation').prop('disabled', true);
            $('#buttonInitialGeneration').prop('disabled', true);

            automaton.setBuildingParameters(buildingParameters);
            
            if ($('#buttonInitialGeneration').text().indexOf('Initial Generation') !== -1) {
                $("#buttonInitialGeneration").text('random');
                automaton.setInitialGeneration('random', true);
                initialGenerationSet = true;

                $('#buttonPropagate').prop('disabled', false);
            }
            else if ($('#buttonInitialGeneration').text() === 'random') {
                automaton.setInitialGeneration('random', true);
                initialGenerationSet = true;

                $('#buttonPropagate').prop('disabled', false);
            }
            else if ($('#buttonInitialGeneration').text() === 'manual') {
                buttons['setInitial'].value = 'Set';
                setManualInput();
            }
        }
        else if (buttons['setInitial'].value === 'Change Initial Parameters') {
            buttons['setInitial'].value = 'Set Initial Parameters';

            $('#buttonSetBuildingParameters').prop('disabled', false);
            $('#inputInvertedPropogation').prop('disabled', false);
            $('#buttonInitialGeneration').prop('disabled', false);
            $('#buttonPropagate').prop('disabled', true);

            automaton.generations = [automaton.generations[0]];
            initialGenerationSet = false;
        }
        else if (buttons['setInitial'].value === 'Set') {
            buttons['setInitial'].value = 'Change Initial Parameters';
            unsetManualInput();

            saveBuildingParameters();
            automaton.setBuildingParameters(buildingParameters);

            $('#buttonPropagate').prop('disabled', false);

            initialGenerationSet = true;
        }
    }

    function propagate() {
        if (buttons['propagate'].value === 'Propagate') {
            buttons['propagate'].value = 'Reset';

            if ($("#buttonRuleset").text().indexOf('Select Ruleset') !== -1) {
                $("#buttonRuleset").text('sheet-000');
            }

            wraparound = inputs['wraparound'].checked;
            ruleset = $("#buttonRuleset").text();

            if (ruleset === 'custom') {
                saveCustomRuleset();
                automaton.setCustomRuleset(customRuleset);
            }
            
            renderedLayerEnd = floors;

            $("#floorSliderValue").text("Floor: " + floors);
            $('#floorSlider').bootstrapSlider({max: floors, value: floors});
            $('#floorSlider').bootstrapSlider("enable");
            $('#buttonExportLayers').prop('disabled', false);
            $('#buttonExportCAD').prop('disabled', false);
            $('#buttonRuleset').prop('disabled', true);
            $('#inputWraparound').prop('disabled', true);
            $('#buttonSetCustomRuleset').prop('disabled', true);
            $('#buttonSetInitial').prop('disabled', true);

            automaton.setWraparound(wraparound);
            automaton.setRuleset(ruleset);
            layerDrawTimer = setInterval(function() {automaton.computeNextGeneration()}, 100);
        }
        else if (buttons['propagate'].value === 'Reset') {
            buttons['propagate'].value = 'Propagate';

            $('#floorSlider').bootstrapSlider({max: 1, value: 1});
            $('#floorSlider').bootstrapSlider("disable");
            $('#buttonExportLayers').prop('disabled', true);
            $('#buttonRuleset').prop('disabled', false);
            $('#inputWraparound').prop('disabled', false);
            if ($('#buttonRuleset').text() === 'custom') {
                $("#buttonSetCustomRuleset").prop('disabled', false);
            }
            $('#buttonSetInitial').prop('disabled', false);

            automaton.reset();
            clearInterval(layerDrawTimer);
        }
    }

    function setManualInput() {
        easycam.setDistance(p.height * 0.87, 700);
        easycam.setRotation([1, 0, 0, 0], 700);
        easycam.setCenter([0, 0, 0], 700);
        easycam.removeMouseListeners();
        setTimeout(function () {p.ortho()}, 700);

        if (automaton.generations.length === 0) {
            automaton.setInitialGeneration('empty');
        }

        p.mouseClicked = setClickedCell;
    }

    function unsetManualInput() {
        easycam.setDistance(1200, 700);
        easycam.setRotation([0.373774147330301, 0.2267155863804119, 0.4680836446901702, -0.7679782752482324], 700);
        easycam.setCenter([0, 0, 350], 700);
        easycam.attachMouseListeners();
        p.perspective();

        p.mouseClicked = function() {}
    }

    function setClickedCell() {
        let cellX = -1;
        let cellY = -1;

        for (let i = 0; i < gridRows; i++) {
            if (p.mouseX > verticalLines[i] && p.mouseX < verticalLines[i+1]) {
                cellX = i;
                break;
            }
        }

        for (let i = 0; i < gridCols; i++) {
            if (p.mouseY > horizontalLines[i] && p.mouseY < horizontalLines[i+1]) {
                cellY = i;
                break;
            }
        }

        if (cellX !== -1 && cellY !== -1) {
            if (automaton.toggleCell(0, cellX, cellY) === -2) {
                showAlert('danger', 'That cell is set as a dead cell.')
            }
        }
    }

    function saveBuildingParameters() {
        let errorInput = '';
        let errorMessage;

        let cellTypes = {};
        let coreCells = {};
        let deadCells = {};
        let floorFill = {};

        if (inputs['floors'].value === '') {
            errorInput = '#inputFloors';
            errorMessage = 'Number of floors is required.';
            floors = 14;
        }
        else if (parseInt(inputs['floors'].value) < 1) {
            errorInput = '#inputFloors';
            errorMessage = 'Floors should be greater than 1.';
            floors = 14;
        }
        else {
            floors = parseInt(inputs['floors'].value);
        }
        
        if (inputs['cellTypes'].value.length !== 0) {
            let temp = inputs['cellTypes'].value.trim().replace(/ /g, '').split('\n');
            
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].trim() !== '') {
                    if (temp[i][0] !== '[') {
                        errorInput = '#inputCellTypes';
                        errorMessage = 'Rule needs to start with a floor range.';
                        break;
                    }
                    cellTypes[temp[i].split(':')[0]] = temp[i].split(':')[1];
                }
            }

            for (var key in cellTypes) {
                if (!(cellTypes[key].toLowerCase() in cellIndicators)) {
                    errorInput = '#inputCellTypes';
                    errorMessage = `Incorrect cell type '${cellTypes[key]}'.`;
                    break;
                }

                let range = key.replace(/[[\]]/g, '');
                let start;
                let end;

                if (range[1] === '-') {
                    start = parseInt(range.split('-')[0]);
                    end = parseInt(range.split('-')[1]);
                }
                else {
                    start = parseInt(range);
                    end = start + 1;
                }
                
                if ((start < 0) || (start > floors) || (end < 0) || (end > floors) || (start > end)) {
                    errorInput = '#inputCellTypes';
                    errorMessage = 'Range out of bounds: please set a valid floor range.';
                    break;
                }

                console.log(cellTypes);
                for (let i = start; i < end; i++) {
                    if (i in cellTypes) {
                        errorInput = '#inputCellTypes';
                        errorMessage = 'Overlapping range: please set a valid floor range.';
                        break;
                    }
                    cellTypes[i] = cellIndicators[cellTypes[key].toLowerCase()];
                }

                delete cellTypes[key];
            }

            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                if(!(floor in cellTypes)) {
                    cellTypes[floor] = cellTypes[(i - 1).toString()];
                }
            }
            $('#inputCellTypes').removeClass('is-invalid');
        }
        else {
            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                cellTypes[floor] = 'generic';
            }
        }

        if (inputs['coreCells'].value.length !== 0) {
            let temp = inputs['coreCells'].value.trim().replace(/\s/g, '');
            temp = temp.split('[');
            
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].trim() !== '') {
                    temp[i] = '[' + temp[i];
                    coreCells[temp[i].split(':')[0]] = temp[i].split(':')[1];
                }
            }

            for (var key in coreCells) {
                let range = key.replace(/[[\]]/g, '');
                let start;
                let end;

                if (range[1] === '-') {
                    start = parseInt(range.split('-')[0]);
                    end = parseInt(range.split('-')[1]);
                }
                else {
                    start = parseInt(range);
                    end = start + 1;
                }

                if ((start < 0) || (start > floors) || (end < 0) || (end > floors) || (start > end)) {
                    errorInput = '#inputCoreCells';
                    errorMessage = 'Range out of bounds: please set a valid floor range.';
                    break;
                }
                
                let coreCellList = coreCells[key].replace(/\s/g, '').replace(/\)\,/g, ')\n').split('\n');   
                
                for (var i = 0; i < coreCellList.length; i++) {
                    coreCellList[i] = coreCellList[i].match(/\(([^)]+)\)/)[1].split(',');
                    
                    let coordX = parseInt(coreCellList[i][0]);
                    let coordY = parseInt(coreCellList[i][1]);

                    if (coordX < 0 || coordX >= gridRows || coordY < 0 || coordY >= gridCols) {
                        errorInput = '#inputCoreCells';
                        errorMessage = 'Coordinates are out of range.';
                        break;
                    }
                    else {
                        coreCellList[i][0] = coordX;
                        coreCellList[i][1] = coordY;
                    }
                }
                
                for (let i = start; i < end; i++) {
                    if (i in coreCells) {
                        errorInput = '#inputCoreCells';
                        errorMessage = 'Overlapping range: please set a valid floor range.';
                        break;
                    }
                    coreCells[i] = coreCellList;
                }

                delete coreCells[key];
            }

            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                if(!(floor in coreCells)) {
                    coreCells[floor] = [];
                }
            }
            $('#inputCoreCells').removeClass('is-invalid');
        }
        else {
            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                coreCells[floor] = [];
            }
        }

        if (inputs['deadCells'].value.length !== 0) {
            let temp = inputs['deadCells'].value.trim().replace(/\s/g, '');
            temp = temp.split('[');
            
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].trim() !== '') {
                    temp[i] = '[' + temp[i];
                    deadCells[temp[i].split(':')[0]] = temp[i].split(':')[1];
                }
            }

            for (var key in deadCells) {
                let range = key.replace(/[[\]]/g, '');
                let start;
                let end;

                if (range[1] === '-') {
                    start = parseInt(range.split('-')[0]);
                    end = parseInt(range.split('-')[1]);
                }
                else {
                    start = parseInt(range);
                    end = start + 1;
                }

                if ((start < 0) || (start > floors) || (end < 0) || (end > floors) || (start > end)) {
                    errorInput = '#inputDeadCells';
                    errorMessage = 'Range out of bounds: please set a valid floor range.';
                    break;
                }
                
                let deadCellList = deadCells[key].replace(/\s/g, '').replace(/\)\,/g, ')\n').split('\n');
                
                for (var i = 0; i < deadCellList.length; i++) {
                    deadCellList[i] = deadCellList[i].match(/\(([^)]+)\)/)[1].split(',');
        
                    let coordX = parseInt(deadCellList[i][0]);
                    let coordY = parseInt(deadCellList[i][1]);

                    if (coordX < 0 || coordX >= gridRows || coordY < 0 || coordY >= gridCols) {
                        errorInput = '#inputDeadCells';
                        errorMessage = 'Coordinates are out of range.';
                        break;
                    }
                    else {
                        deadCellList[i][0] = coordX;
                        deadCellList[i][1] = coordY;
                    }
                }
                
                for (let i = start; i < end; i++) {
                    if (i in deadCells) {
                        errorInput = '#inputDeadCells';
                        errorMessage = 'Overlapping range: please set a valid floor range.';
                        break;
                    }
                    deadCells[i] = deadCellList;
                }

                delete deadCells[key];
            }

            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                if(!(floor in deadCells)) {
                    deadCells[floor] = [];
                }
            }
            $('#inputDeadCells').removeClass('is-invalid');
        }
        else {
            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                deadCells[floor] = [];
            }
        }

        if (inputs['floorFill'].value.length !== 0) {
            let temp = inputs['floorFill'].value.trim().replace(/ /g, '').split('\n');

            for (let i = 0; i < temp.length; i++) {
                if (temp[i].trim() !== '') {
                    if (temp[i][0] !== '[') {
                        errorInput = '#inputFloorFill';
                        errorMessage = 'Rule needs to start with a floor range.';
                        break;
                    }
                    floorFill[temp[i].split(':')[0]] = temp[i].split(':')[1].replace(/\s/, '');
                }
            }

            for (var key in floorFill) {
                let range = key.replace(/[[\]]/g, '');
                let start;
                let end;

                if (range[1] === '-') {
                    start = parseInt(range.split('-')[0]);
                    end = parseInt(range.split('-')[1]);
                }
                else {
                    start = parseInt(range);
                    end = start + 1;
                }

                if ((start < 0) || (start > floors) || (end < 0) || (end > floors) || (start > end)) {
                    errorInput = '#inputFloorFill';
                    errorMessage = 'Range out of bounds: please set a valid floor range.';
                    break;
                }

                for (let i = start; i < end; i++) {
                    if (i in floorFill) {
                        errorInput = '#inputFloorFill';
                        errorMessage = 'Overlapping range: please set a valid floor range.';
                        break;
                    }
                    floorFill[i] = parseInt(floorFill[key]);
                }

                delete floorFill[key];
            }

            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                if(!(floor in floorFill)) {
                    floorFill[floor] = -1;
                }
            }
            $('#inputFloorFill').removeClass('is-invalid');
        }
        else {
            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                floorFill[floor] = -1;
            }
        }

        if (errorInput === '') {
            $('#inputCellTypes').removeClass('is-invalid');
            $('#inputCoreCells').removeClass('is-invalid');
            $('#inputDeadCells').removeClass('is-invalid');
            $('#inputFloorFill').removeClass('is-invalid');

            buildingParameters['cellTypes'] = cellTypes;
            buildingParameters['coreCells'] = coreCells;
            buildingParameters['deadCells'] = deadCells;
            buildingParameters['floorFill'] = floorFill;

            $('#buildingParametersModal').modal('hide');
            
            return 1;
        }
        else {
            showError();
            buildingParameters = defaultBuildingParameters;

            return -1;
        }

        if (invertedPropogation) {
            for (var i = 0; i < floors/2; i++) {
                let floor = i;
                let inverseFloor = floors-i-1;
                let temp;

                temp = buildingParameters['cellTypes'][floor];
                buildingParameters['cellTypes'][floor] = buildingParameters['cellTypes'][inverseFloor];
                buildingParameters['cellTypes'][inverseFloor] = temp;

                temp = buildingParameters['coreCells'][floor];
                buildingParameters['coreCells'][floor] = buildingParameters['coreCells'][inverseFloor];
                buildingParameters['coreCells'][inverseFloor] = temp;

                temp = buildingParameters['deadCells'][floor];
                buildingParameters['deadCells'][floor] = buildingParameters['deadCells'][inverseFloor];
                buildingParameters['deadCells'][inverseFloor] = temp;

                temp = buildingParameters['floorFill'][floor];
                buildingParameters['floorFill'][floor] = buildingParameters['floorFill'][inverseFloor];
                buildingParameters['floorFill'][inverseFloor] = temp;
            }
        }

        function showError() {
            $(errorInput).addClass('is-invalid');
            $(errorInput + 'Feedback').text(errorMessage);
        }
    }

    function saveCustomRuleset() {
        let birth = inputs['birthConditions'].value.replace(/\s/g, '').split(',');
        let death = inputs['deathConditions'].value.replace(/\s/g, '').split(',');

        customRuleset['birth'] = birth;
        customRuleset['death'] = death;

        $('#customRulesetModal').modal('hide');
    }

    function exportLayers() {
        var layerData = '';

        for (let layer = 0; layer < automaton.generations.length; layer++) {
            layerData += 'Floor ' + (layer + 1) + '\n';
            for (let j = 0; j < automaton.generations[0][0].length; j++) {
                layerData += '---';
            }

            layerData += '\n';

            for (let i = 0; i < automaton.generations[layer].length; i++) {
                
                for (let j = 0; j < automaton.generations[layer][i].length; j++) {
                    if (automaton.generations[layer][i][j] === 0) {
                        layerData += ' - ';
                    }
                    else {
                        //layerData += automaton.generations[layer][i][j];
                        layerData += ' x ';
                    }
                }
                layerData += '\n';
            }

            for (let j = 0; j < automaton.generations[0][0].length; j++) {
                layerData += '---';
            }

            layerData += '\n\n';
        }

        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(layerData));
        pom.setAttribute('download', ruleset + '-' + getFormattedDate() + '.txt');

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    }

    function exportCAD() {
        var scadData = '';
        scadData += '// SCAD file generated from Cellular Automata simulator.\n';
        scadData += '// Author: Pushpreet Singh Hanspal.\n';
        scadData += '// Code: https://github.com/pushpreet/cellular-automaton/\n';
        scadData += '// Demo: https://pushpreet.github.io/cellular-automaton/\n';
        scadData += '\n';
        scadData += '';

        let mmtom = 1000;

        scadData += 'mult = 2;\n\n';
        scadData += `translate([${(unitSize * cellXYScale * mmtom)/2}, ${(unitSize * cellXYScale * mmtom)/2}, ${(unitSize * cellZScale * mmtom)/2}]) {\n`;
        scadData += `\tscale([${unitSize * cellXYScale * mmtom}, ${unitSize * cellXYScale * mmtom}, ${unitSize * cellZScale * mmtom}]) {\n`;
        for (let layer = 0; layer < automaton.generations.length; layer++) {
            scadData += `\t\t// ***************** Floor ${layer} *****************\n`
            for (let row=0; row < automaton.generations[0].length; row++) {
                for (let col=0; col < automaton.generations[0][0].length; col++) {
                    if (automaton.generations[layer][row][col] !== 0) {
                        scadData += `\t\ttranslate([${col}, ${row}, ${layer} * mult]) { cube(1, true); }\n`;
                    }
                }
            }
            scadData += '\n';
        }
        scadData += '\t}\n';
        scadData += '}\n';

        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(scadData));
        pom.setAttribute('download', ruleset + '-' + getFormattedDate() + '.scad');

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    }

    function getFormattedDate() {
        var d = new Date();

        var month = d.getMonth()+1;
        var day = d.getDate();

        var output = d.getFullYear() + '/' +
            (month<10 ? '0' : '') + month + '/' +
            (day<10 ? '0' : '') + day;

        return output;
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
        p.strokeWeight(2);

        for (let i = 0; i < gridRows + 1; i++) {
            let x = i * scaledUnitSize;
            if (i === 0) p.stroke('#e74c3c');
            else p.stroke('#7f8c8d');
            p.line((_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 - scaledPlotSizeY/2 - mainWindowPadding/2, 
                    (_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 + scaledPlotSizeY/2 + mainWindowPadding/2);
            
            verticalLines[i] = (_left + _right)/2 - scaledPlotSizeX/2 + x + p.width/2;
        }

        for (let j = 0; j < gridCols + 1; j++) {
            let y = j * scaledUnitSize;

            if (j === 0) p.stroke('#3498db');
            else p.stroke('#7f8c8d');

            p.line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                    (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);

            horizontalLines[j] = (_top + _bottom)/2 - scaledPlotSizeY/2 + y + p.height/2;
        }
    }

    function drawLayers(generations, layerStart, layerEnd) {
        if (typeof(layerStart) === 'undefined') layerStart = 0;
        if (typeof(layerEnd) === 'undefined') layerEnd = layerStart + 1;
        
        if (layerEnd > generations.length) layerEnd = generations.length;
        if (layerStart === -1) layerStart = layerEnd - 1;
        if (layerStart < 0) layerStart = 0;

        var _generations;
        if (invertedPropogation) {
            _generations = (generations).reduceRight(function(previous, current) {
                previous.push(current);
                return previous;
            }, []);
        }
        else {
            _generations = generations;
        }

        if (renderCellOutline) {
            p.stroke('#000000');
            p.strokeWeight(2);
        }
        else {
            p.noStroke();
        }
        
        p.translate(gridTopLeft.x, gridTopLeft.y, (gridTopLeft.z * cellZScale) + (scaledUnitSize * layerStart));
        for (let layer = layerStart; layer < layerEnd; layer++) {
            for (let i = 0; i < gridRows; i++) {
                for (let j = 0; j < gridCols; j++) {
                    if (_generations[layer][i][j] > 0) {
                        p.ambientMaterial(cellColors[_generations[layer][i][j]]);
                        p.box(scaledUnitSize * cellXYScale, scaledUnitSize * cellXYScale, scaledUnitSize * cellZScale);
                    }
                    p.translate(0, scaledUnitSize, 0);
                }
                p.translate(scaledUnitSize, -gridCols * scaledUnitSize, 0);
            }
            p.translate(-gridRows * scaledUnitSize, 0, scaledUnitSize * cellZScale);
        }
    }
}

new p5(sketch, 'main-window');
