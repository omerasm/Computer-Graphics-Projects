var canvas;
var gl;

var maxNumTriangles = 3000;
var maxNumVertices = 3 * maxNumTriangles;

var selectStartX;
var selectStartY;
var selectEndX;
var selectEndY;

var selectionMade = false;

var indexrez;
var dragging = false;

var dragStartX;
var dragStartY;
var dragEndX;
var dragEndY;

var dragBuffer = [];

var index = 0;
var lastTriangleX = [];
var lastTriangleY = [];
var lastColorId;
var lastMouse;
var colorId = 0;

var redraw = false;

const Mouse = { Brush: 0, Eraser: 1, Select: 2, Copy: 3 };
var mouse = Mouse.Brush;

var undoTClone = [];
var redoTClone = [];


var vBuffer = [];
var cBuffer = [];

var allVertices = [];

var indexHolder = [];
var indexRedoer = [];

var colorHolder = [];
var colorChanger = 0;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect = 1.0;       // Viewport aspect ratio
var near = 0.3;
var far = 3.0;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var modelViewMatrix;
var modelViewMatrixLoc;

var layer1 = [];
var layer2 = [];
var layer3 = [];

var layer1 = 1;
var layer2 = 2;
var layer3 = 3;

var chosenOne = 1;

var finalLayer = [];

function layer_1() {
    chosenOne = 1;
}

function layer_2() {
    chosenOne = 2;
}

function layer_3() {
    chosenOne = 3;
}

function up_arrow() {

    switch (chosenOne) {
        case 1:
            if (layer1 != 3) {
                layer1++;
                if (layer1 == layer2) { layer2--; }
                else { layer3--; }
            }
            break;
        case 2:
            if (layer2 != 3) {
                layer2++;
                if (layer1 == layer2) { layer1--; }
                else { layer3--; }
            }
            break;
        case 3:
            if (layer3 != 3) {
                layer3++;
                if (layer3 == layer2) { layer2--; }
                else { layer1--; }
            }
            break;
    }
}

function down_arrow() {

    switch (chosenOne) {
        case 1:
            if (layer1 != 1) {
                layer1--;
                if (layer1 == layer2) { layer2++; }
                else { layer3++; }
            }
            break;
        case 2:
            if (layer2 != 1) {
                layer2--;
                if (layer1 == layer2) { layer1++; }
                else { layer3++; }
            }
            break;
        case 3:
            if (layer3 != 1) {
                layer3--;
                if (layer3 == layer2) { layer2++; }
                else { layer1++; }
            }
            break;
    }
}


var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
];

function buttonBrush() {
  mouse = Mouse.Brush;
  selectionMade = false;
}

function buttonEraser() {
  mouse = Mouse.Eraser;
  selectionMade = false;
}

function buttonSelect() {
  mouse = Mouse.Select;
  selectionMade = false;
}

function buttonCopy() {
  mouse = Mouse.Copy;
  selectionMade = false;
}

function buttonBlack() {
    colorId = 0;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
    
}

function buttonRed() {
    colorId = 1;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonYellow() {
    colorId = 2;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonGreen() {
    colorId = 3;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonBlue() {
    colorId = 4;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonMagenta() {
    colorId = 5;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function saveState() {
    var tClone = deepClone(allVertices);
    undoTClone.push(tClone);
    indexHolder.push(index);
    redoTClone = [];
}
function undo_op() {
    if (undoTClone.length > 0) {
        var temp = indexHolder.pop();
        indexRedoer.push(temp);
        index = 0;
        var cloneTemp = undoTClone.pop()
        var popped = deepClone(cloneTemp);
        redoTClone.push(popped);
        allVertices = deepClone(popped);
        lengthPopped = popped.length;
        colorChanger = 0;
        colorId = colorHolder[0];
        for (let i = 0; i < lengthPopped; i++) {
            if ((i * 3 >= indexHolder[colorChanger+1]) && (colorChanger < colorHolder.length)) {
                colorChanger++;
                colorId = colorHolder[colorChanger];
            }
            var vertices = popped[i];
            draw(vertices[0], vertices[1]);
        }

        if (indexHolder.length > 0) {
            index = indexHolder[indexHolder.length - 1];
        }

    }

}

function deepClone(clown) {
    var deepCopy = [];
    for (let i = 0; i < clown.length; i++) {
        deepCopy[i] = clown[i].slice();
    }
    return deepCopy;
}

function redo_op() {
    colorId = colorHolder[0];
    if (redoTClone.length > 0) {
        colorChanger = 0
        index = 0;
        var pushed = deepClone(redoTClone.pop());
        undoTClone.push(pushed);
        lengthPushed = pushed.length;
        colorId = colorHolder[0];
        for (let i = 0; i < lengthPushed; i++) {
            if ((i*3 >= indexHolder[colorChanger+1]) && (colorChanger < colorHolder.length)) {
                colorChanger++;
                colorId = colorHolder[colorChanger];
            }
            var vertices = pushed[i];
            draw(vertices[0], vertices[1]);
        }
        index = indexRedoer.pop();
        indexHolder.push(index);
    }
}

function zoom_in(){
    fovy = fovy;
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" ); 

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) { alert("WebGL isn't available"); }

    canvas.addEventListener("mousedown", function(event){
      redraw = true;
      if( mouse === Mouse.Select || mouse === Mouse.Copy) {
        if (!selectionMade) {
          selectStartX = event.clientX;
          selectStartY = event.clientY;
        }
        else {
          dragging = true;
          dragStartX = event.clientX;
          dragStartY = event.clientY;
        }
      }
    });

    canvas.addEventListener("mouseup", function(event){
        redraw = false;
        saveState();
        if((mouse === Mouse.Select || mouse === Mouse.Copy) && !selectionMade) {
          selectEndX = event.clientX;
          selectEndY = event.clientY;

          // find square center
          const rect = canvas.getBoundingClientRect();

          var normalStartX = 2*(selectStartX - rect.left)/canvas.width-1;
          var normalStartY = 2*(canvas.height-(selectStartY - rect.top))/canvas.height-1;
          
          var normalEndX = 2*(selectEndX - rect.left)/canvas.width-1;
          var normalEndY = 2*(canvas.height-(selectEndY - rect.top))/canvas.height-1;

          maxX = Math.max(normalStartX,normalEndX);
          maxY = Math.max(normalStartY,normalEndY);
          minX = Math.min(normalStartX,normalEndX);
          minY = Math.min(normalStartY,normalEndY);

          indexrez = index;

              // copied from eraser part
              for ( var i = 0; i < indexrez / 3; i+=1 ) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                var oldTri = new Float32Array(6);
                gl.getBufferSubData(gl.ARRAY_BUFFER, 24*i, oldTri, 0);
                for ( var j = 0; j < 3; j++ ) {

                  if ( oldTri[2*j] < maxX && oldTri[2*j] > minX && oldTri[2*j+1] > minY && oldTri[2*j+1] < maxY ) {
                    // triangle is INNNN BABY
                    if ( mouse === Mouse.Select) {
                      gl.bufferSubData(gl.ARRAY_BUFFER, 24*i, flatten([0,0,0,0,0,0]));
                    }

                    var oldTriColor = new Float32Array(12);
                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                    gl.getBufferSubData(gl.ARRAY_BUFFER, 48*i, oldTriColor, 0);

                    if ( mouse === Mouse.Select) {
                      gl.bufferSubData(gl.ARRAY_BUFFER, 48*i, flatten([0,0,0,0,0,0,0,0,0,0,0,0]));
                    }

                    var oldTriColorPortion = new Float32Array(4);
                    for (var k = 0; k < 4; k++) {
                      oldTriColorPortion[k] = oldTriColor[k];
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, oldTri);
                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, oldTriColor);
                    index += 3;
                    selectionMade = true;
                    console.log(oldTri);
                    break;
                  }
                }
              }
              //
            }
            else if((mouse === Mouse.Select || mouse === Mouse.Copy) && dragging) {
              selectionMade = false;
              dragging = false;
            }
    });
    indexHolder.push(0);
    colorHolder.push(0);

    //canvas.addEventListener("mousedown", function(){
    canvas.addEventListener("mousemove", function(event){

          if ( dragging && selectionMade && (mouse === Mouse.Select || mouse === Mouse.Copy) ) {
            dragEndX = event.clientX;
            dragEndY = event.clientY;

            dragUnitX = (dragEndX - dragStartX);
            dragUnitY = (dragEndY - dragStartY);

            //var normalEndX = 2*(selectEndX - rect.left)/canvas.width-1;
            //var normalEndY = 2*(canvas.height-(selectEndY - rect.top))/canvas.height-1;
            // indexrez'den itibaren olan ucgenlerin hepsi otelencek
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            for ( var curpt = indexrez; curpt < index; curpt += 1 ) {
              var vec = new Float32Array(2);
              gl.getBufferSubData(gl.ARRAY_BUFFER, 8*curpt, vec, 0);
              var xdif = (Math.round(15*(dragUnitX*1/600000 - 0.03333333507180214)))/15 + 0.03333333507180214;
              var ydif = (Math.round(15*(dragUnitY*1/600000 - 0.03333333507180214)))/15 + 0.03333333507180214;
              console.log("xdif: " + xdif);
              console.log("ydif: " + ydif);
              vec[0] += xdif;
              vec[1] -= ydif;
              gl.bufferSubData(gl.ARRAY_BUFFER, 8*curpt, vec);
            }

            dragStartX = dragEndX;
            dragStartY = dragEndY;
            
            
          }
          else if(redraw && mouse === Mouse.Brush) {
            var [verticeX, verticeY] = getTriangle(event.clientX,event.clientY);
            // burasi brush eraser arasi switchlerken bozabilir ama ayarlarizzz 
            if (lastTriangleX[0] === verticeX[0] &&
              lastTriangleX[1] === verticeX[1] &&
              lastTriangleX[2] === verticeX[2] &&
              lastTriangleY[0] === verticeY[0] &&
              lastTriangleY[1] === verticeY[1] &&
              lastTriangleY[2] === verticeY[2] &&
              lastColorId === colorId &&
              lastMouse === Mouse.Brush ) {
              return;
            }
              draw(verticeX, verticeY);
              var vertice = [verticeX, verticeY];
              allVertices.push(vertice);
              
            lastTriangleX = verticeX;
            lastTriangleY = verticeY;
            lastColorId = colorId;
            lastMouse = Mouse.Brush;
          }
          else if(redraw && mouse === Mouse.Eraser) {
            var diff;
            var [verticeX, verticeY] = getTriangle(event.clientX,event.clientY);
            if (lastTriangleX[0] === verticeX[0] &&
              lastTriangleX[1] === verticeX[1] &&
              lastTriangleX[2] === verticeX[2] &&
              lastTriangleY[0] === verticeY[0] &&
              lastTriangleY[1] === verticeY[1] &&
              lastTriangleY[2] === verticeY[2] &&
              lastMouse === Mouse.Eraser) {
              return;
            }
            lastTriangleX = verticeX;
            lastTriangleY = verticeY;
            lastMouse = Mouse.Eraser;
            var newTri = new Float32Array(6);
            for ( var i = 0; i < 3; i++ ) {
              newTri[2*i] = 2*verticeX[i]/canvas.width-1;
              newTri[2*i+1] = 2*(canvas.height-verticeY[i])/canvas.height-1;
            }
            for ( var i = 0; i < index / 3; i+=1 ) {
              diff = false;
              gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
              var oldTri = new Float32Array(6);
              gl.getBufferSubData(gl.ARRAY_BUFFER, 24*i, oldTri, 0);
              for ( var j = 0; j < 6; j++ ) {
                if (oldTri[j] !== newTri[j]) {
                  diff = true;
                }
              }
              if (!diff) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 24*i, flatten([0,0,0,0,0,0]));
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 48*i, flatten([0,0,0,0,0,0,0,0,0,0,0,0]));
              }
            }
          }
    } );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1, 0.9, 0.9, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vColor);

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    render();

}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, index );

    window.requestAnimFrame(render);
}

function finalLayerDecider() {

    finalLayer = [];
    if (layer1 > layer2 && layer2 > layer3 )
    {
        finalLayer = layer1.concat(layer2.concat(layer3))
    }
    if (layer1 > layer2 && layer3 > layer2 )
    {
        finalLayer = layer1.concat(layer3.concat(layer2))
    }
    if (layer2 > layer2 && layer1 > layer3 )
    {
        finalLayer = layer2.concat(layer1.concat(layer3))
    }
    if (layer2 > layer2 && layer3 > layer1 )
    {
        finalLayer = layer2.concat(layer3.concat(layer1))
    }
    if (layer3 > layer2 && layer2 > layer1 )
    {
        finalLayer = layer3.concat(layer2.concat(layer1))
    }
    if (layer3 > layer2 && layer1 > layer2 )
    {
        finalLayer = layer3.concat(layer1.concat(layer2))
    }

    console.log("layer 1:", layer1 , "layer 2:", layer2, "layer 3:", layer3)
}

function finalDrawer() {
    finalLayerDecider();
    for (let i = 0; i < finalLayer.length; i++) { 
        draw(finalLayer[i][0], finalLayer[i][1])
    }
}
function draw(verticeX, verticeY) {

    for (var i = 0; i < 3; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        var t = vec2(2 * verticeX[i] / canvas.width - 1,
            2 * (canvas.height - verticeY[i]) / canvas.height - 1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        t = vec4(colors[colorId]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));
        index++;
    }
}

function zoomer() {
    //gl.clear(gl.COLOR_BUFFER_BIT);

    //projectionMatrix = perspective(60, aspect, near, far);

    //gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    //requestAnimFrame(render);
}

function getTriangle(inputX,inputY) {
            
            const rect = canvas.getBoundingClientRect();
            var reloX = inputX - rect.left;
            var reloY = inputY - rect.top;
            var squareX = reloX - (reloX%20) + 10;
            var squareY = reloY - (reloY%20) + 10;
            var verticeX = [];
            var verticeY = [];
            verticeX.push(squareX);
            verticeY.push(squareY);

            if (reloX - reloY > squareX - squareY) {
              // up/right
              verticeX.push(squareX + 10);
              verticeY.push(squareY - 10);
            }
            else {
              // down/left
              verticeX.push(squareX - 10);
              verticeY.push(squareY + 10);
            }
            if (reloX + reloY > squareX + squareY) {
              // right/down
              verticeX.push(squareX + 10);
              verticeY.push(squareY + 10);
            }
            else {
              // up/left
              verticeX.push(squareX - 10);
              verticeY.push(squareY - 10);
            }

            return [verticeX, verticeY]
}
