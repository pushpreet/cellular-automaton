var plotSizeX;
var plotSizeY;
var unitSize;
var floors;  
var wraparound;
var ruleset;
var buildingParameters = {};
var customRuleset = {};

var initialGenerationSet = false;

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

    var cellDrawScale = 1;

    let gridRows;
    let gridCols;

    let renderType = '3D';
    let layerDrawTimer;

    var automaton = new CellularAutomaton();

    var renderedLayerStart = 0;
    var renderedLayerEnd = 1;

    var renderCellOutline = true;

    var easycam;

    let inputs = {};
    let buttons = {};

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
                center: [0, 0, 350],
                rotation: [0.373774147330301, 0.2267155863804119, 0.4680836446901702, -0.7679782752482324],
                //rotation: [0.5, 0.5, 0.5, -0.5],
            }
        );

        //easycam.removeMouseListeners();
        easycam.setDistanceMin(500);
        easycam.setDistanceMax(2500);

        inputs['plotWidth'] = document.getElementById('inputPlotWidth');
        inputs['plotLength'] = document.getElementById('inputPlotLength');
        inputs['unitSize'] = document.getElementById('inputUnitSize');
        inputs['floors'] = document.getElementById('inputFloors');
        inputs['wraparound'] = document.getElementById('inputWraparound');
        inputs['singleFloor'] = document.getElementById('inputSingleFloor');
        inputs['ruleset'] = document.getElementById('buttonRuleset');
        inputs['cellTypes'] = document.getElementById('inputCellTypes');
        inputs['coreCells'] = document.getElementById('inputCoreCells');
        inputs['deadCells'] = document.getElementById('inputDeadCells');
        inputs['birthConditions'] = document.getElementById('inputBirthConditions');
        inputs['deathConditions'] = document.getElementById('inputDeathConditions');
        inputs['cellOutline'] = document.getElementById('inputCellOutline');

        buttons['setInitial'] = document.getElementById('buttonSetInitial');
        buttons['propagate'] = document.getElementById('buttonPropagate');
        buttons['exportLayers'] = document.getElementById('buttonExportLayers');
        buttons['saveBuildingParameters'] = document.getElementById('buttonSaveBuildingParameters');
        buttons['saveCustomRuleset'] = document.getElementById('buttonSaveCustomRuleset');

        buttons['setInitial'].onclick = setInitialParameters;
        buttons['propagate'].onclick = propagate;
        buttons['exportLayers'].onclick = exportLayers;
        buttons['saveBuildingParameters'].onclick = saveBuildingParameters;
        buttons['saveCustomRuleset'].onclick = saveCustomRuleset;

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

        $('#buttonExportLayers').prop('disabled', true);

        $('#floorSlider').bootstrapSlider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        });

        $('#floorSlider').on("slide", function(slideEvt) {
            $("#floorSliderValue").text("Floor: " + slideEvt.value);
            renderedLayerEnd = slideEvt.value;
        });

        $('#inputSingleFloor').click(function() {
            if (this.checked) renderedLayerStart = -1;
            else renderedLayerStart = 0;
        });

        $('#inputCellOutline').click(function() {
            if (this.checked) renderCellOutline = true;
            else renderCellOutline = false;
        });

        $('#cellDrawScaleSlider').bootstrapSlider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        });

        $('#cellDrawScaleSlider').on("slide", function(slideEvt) {
            $("#cellDrawScaleValue").text("Cell Draw Scale: " + slideEvt.value.toPrecision(2) + 'x');
            cellDrawScale = slideEvt.value.toPrecision(2);
        });

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

        //console.log(easycam.getRotation());
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

    function setInitialParameters() {
        clearInterval(layerDrawTimer);
        saveBuildingParameters();

        $('#floorSlider').bootstrapSlider({max: 1, value: 1});
        $('#floorSlider').bootstrapSlider("disable");
        $('#buttonExportLayers').prop('disabled', true);

        automaton.initialise(gridRows, gridCols, false);
        automaton.setBuildingParameters(buildingParameters);
        automaton.setInitialGeneration('random', true);
        buttons['propagate'].value = 'Propagate';
        initialGenerationSet = true;
    }

    function propagate() {
        if (initialGenerationSet === false) {
            showAlert('danger', 'Please set the initial generation first!');
        }
        else if ($("#buttonRuleset").text().indexOf('Select Ruleset') !== -1) {
            showAlert('danger', 'Please select the ruleset first!');
        }
        else if (buttons['propagate'].value === 'Propagate') {
            buttons['propagate'].value = 'Reset';

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

            automaton.setWraparound(wraparound);
            automaton.setRuleset(ruleset);
            layerDrawTimer = setInterval(function() {automaton.computeNextGeneration()}, 100);
        }
        else if (buttons['propagate'].value === 'Reset') {
            buttons['propagate'].value = 'Propagate';

            $('#floorSlider').bootstrapSlider({max: 1, value: 1});
            $('#floorSlider').bootstrapSlider("disable");
            $('#buttonExportLayers').prop('disabled', true);

            automaton.reset();
        }
    }

    function saveBuildingParameters() {
        let cellTypes = {};
        let coreCells = {};
        let deadCells = {};

        floors = parseInt(inputs['floors'].value);
        
        if (inputs['cellTypes'].value.length !== 0) {
            let temp = inputs['cellTypes'].value.replace(/ /g, '').split('\n');
            
            for (let i = 0; i < temp.length; i++) {
                cellTypes[temp[i].split(':')[0]] = temp[i].split(':')[1];
            }

            for (var key in cellTypes) {
                let range = key.replace(/[[\]]/g, '');
                
                let start = parseInt(range.split('-')[0]);
                let end = parseInt(range.split('-')[1]);

                for (let i = start; i < end; i++) {
                    cellTypes[i] = cellIndicators[cellTypes[key]];
                }

                delete cellTypes[key];
            }

            for (let i = 0; i < floors; i++) {
                let floor = i.toString();
                if(!(floor in cellTypes)) {
                    cellTypes[floor] = cellTypes[(i - 1).toString()];
                }
            }
        }

        if (inputs['coreCells'].value.length !== 0) {
            let temp = inputs['coreCells'].value.replace(/ /g, '').split('\n');
            
            for (let i = 0; i < temp.length; i++) {
                coreCells[temp[i].split(':')[0]] = temp[i].split(':')[1];
            }

            for (var key in coreCells) {
                let range = key.replace(/[[\]]/g, '');
                
                let start = parseInt(range.split('-')[0]);
                let end = parseInt(range.split('-')[1]);
                
                let coreCellList = coreCells[key].replace(/\s/g, '').replace(/\)\,/g, ')\n').split('\n');
                
                for (var i = 0; i < coreCellList.length; i++) {
                    coreCellList[i] = coreCellList[i].match(/\(([^)]+)\)/)[1].split(',');
        
                    for (var j =0; j < coreCellList[i].length; j++) {
                        coreCellList[i][j] = parseInt(coreCellList[i][j]);
                    }
                }
                
                for (let i = start; i < end; i++) {
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
        }

        if (inputs['deadCells'].value.length !== 0) {
            let temp = inputs['deadCells'].value.replace(/ /g, '').split('\n');
            
            for (let i = 0; i < temp.length; i++) {
                deadCells[temp[i].split(':')[0]] = temp[i].split(':')[1];
            }

            for (var key in deadCells) {
                let range = key.replace(/[[\]]/g, '');
                
                let start = parseInt(range.split('-')[0]);
                let end = parseInt(range.split('-')[1]);
                
                let deadCellList = deadCells[key].replace(/\s/g, '').replace(/\)\,/g, ')\n').split('\n');
                
                for (var i = 0; i < deadCellList.length; i++) {
                    deadCellList[i] = deadCellList[i].match(/\(([^)]+)\)/)[1].split(',');
        
                    for (var j =0; j < deadCellList[i].length; j++) {
                        deadCellList[i][j] = parseInt(deadCellList[i][j]);
                    }
                }
                
                for (let i = start; i < end; i++) {
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
        }

        buildingParameters['cellTypes'] = cellTypes;
        buildingParameters['coreCells'] = coreCells;
        buildingParameters['deadCells'] = deadCells;

        $('#buildingParametersModal').modal('hide');
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
        }

        for (let j = 0; j < gridCols + 1; j++) {
            let y = j * scaledUnitSize;

            if (j === 0) p.stroke('#3498db');
            else p.stroke('#7f8c8d');

            p.line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                    (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);
        }
    }

    function drawLayers(generations, layerStart, layerEnd) {
        if (typeof(layerStart) === 'undefined') layerStart = 0;
        if (typeof(layerEnd) === 'undefined') layerEnd = layerStart + 1;
        
        if (layerEnd > generations.length) layerEnd = generations.length;
        if (layerStart === -1) layerStart = layerEnd - 1;
        if (layerStart < 0) layerStart = 0;

        if (renderCellOutline) {
            p.stroke('#000000');
            p.strokeWeight(2);
        }
        else {
            p.noStroke();
        }
        
        p.translate(gridTopLeft.x, gridTopLeft.y, gridTopLeft.z + (scaledUnitSize * layerStart));
        for (let layer = layerStart; layer < layerEnd; layer++) {
            for (let i = 0; i < gridRows; i++) {
                for (let j = 0; j < gridCols; j++) {
                    if (generations[layer][i][j] > 0) {
                        p.ambientMaterial(cellColors[generations[layer][i][j]]);
                        p.box(scaledUnitSize * cellDrawScale, scaledUnitSize * cellDrawScale, scaledUnitSize);
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
