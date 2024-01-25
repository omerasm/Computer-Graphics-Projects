
var NumVerticesCube = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)
var NumVerticesSphere = 100000;

var points = [];
var colors = [];
var normals = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var texCoordsArray = [];
var texture;
var texSize = 256;


var tex_url = "https://i.imgur.com/jyn9MIw.jpg";


var test_tex = new Uint8Array(4 * texSize * texSize);
var c;
var numChecks = 3;
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var patchx = Math.floor(i / (texSize / numChecks));
        var patchy = Math.floor(j / (texSize / numChecks));
        if (patchx % 2 ^ patchy % 2) c = 255;
        else c = 0;
        //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
        test_tex[4 * i * texSize + 4 * j] = c;
        test_tex[4 * i * texSize + 4 * j + 1] = c;
        test_tex[4 * i * texSize + 4 * j + 2] = c;
        test_tex[4 * i * texSize + 4 * j + 3] = 255;
    }
}

function configureTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo =
    {
        width: 1,
        height: 1,
        texture: texture,
    };

    var img = new Image();
    img.addEventListener('load', function () {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, test_tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });

    requestCORSIfNotSameOrigin(img, tex_url);
    img.src = tex_url;
}

function requestCORSIfNotSameOrigin(img, tex_url) {
    if ((new URL(tex_url)).origin !== window.location.origin) {
        img.crossOrigin="";
    }
}

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

// Parameters controlling the size of the Robot's arm

/*
var OCTOHEAD_HEIGHT = 4.0;
var OCTOHEAD_WIDTH = 3.5;
var OCTOARM_LENGTH = 2.5;
var OCTOARM_WIDTH = 0.7;
var OCTOJOINT_WIDTH = 0.3;
var OCTOEYE_WIDTH = 1.0;
*/

var OCTOHEAD_HEIGHT = 2.0;
var OCTOHEAD_WIDTH = 1.75;
var OCTOARM_LENGTH = 1.25;
var OCTOARM_WIDTH = 0.35;
var OCTOJOINT_WIDTH = 0.15;
var OCTOEYE_WIDTH = 0.5;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var octostate = [[[0,0,0],[0,0,0]]  ,  [[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]]];
var inputoctostate = [[[0,0,0],[0,0,0]]  ,  [[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]]];

var octoheadstate = [[0,0,0],[0,0,0]];

// octostate[0][0] headT
// octostate[0][1] headR
// octostate[armno][jointno][rotaxis]    armno: 1-8, jointno: 0-2, rotaxis: 0-1
var octoanim = [];

var arm = 1;

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer, nBuffer, tBuffer;

var lightPosition = vec4(-1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(0.4, 0.5, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 1000.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;
//----------------------------------------------------------------------------

function quadV(  a,  b,  c,  d ) {

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    points.push(vertices[a]);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(vertices[b]);
    normals.push(normal);
    texCoordsArray.push(texCoord[1])
    points.push(vertices[c]);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
    points.push(vertices[a]);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(vertices[c]);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
    points.push(vertices[d]);
    normals.push(normal);
    texCoordsArray.push(texCoord[3])
}

function darkquadV(  a,  b,  c,  d ) {

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    points.push(vertices[a]);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(vertices[b]);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
    points.push(vertices[c]);
    normals.push(normal);
    texCoordsArray.push(texCoord[1])
    points.push(vertices[a]);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(vertices[c]);
    normals.push(normal);
    texCoordsArray.push(texCoord[3])
    points.push(vertices[d]);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
}

function quad(  a,  b,  c,  d ) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    points.push(a);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(b);
    normals.push(normal);
    texCoordsArray.push(texCoord[1])
    points.push(c);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
    points.push(a);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(c);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
    points.push(d);
    normals.push(normal);
    texCoordsArray.push(texCoord[3])
}

// a,b,c should be arrays of 4 (homo or smth)
function trio( a,b,c ) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    points.push(a);
    normals.push(normal);
    texCoordsArray.push(texCoord[0])
    points.push(b);
    normals.push(normal);
    texCoordsArray.push(texCoord[1])
    points.push(c);
    normals.push(normal);
    texCoordsArray.push(texCoord[2])
}

function divideTrioV(a,b,c,n) {
    divideTrio(vertices[a],vertices[b],vertices[c],n);
}

function divideTrio(a, b, c, count) {
    a = normalize(a,true);
    b = normalize(b,true);
    c = normalize(c,true);
    if ( count > 0 ) {
        var ab = mix( a, b, 0.5);
        var bc = mix( c, b, 0.5);
        var ac = mix( a, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTrio( a, ab, ac, count - 1 );
        divideTrio( ab, b, bc, count - 1 );
        divideTrio( bc, c, ac, count - 1 );
        divideTrio( ab, bc, ac, count - 1 );
    }
    else { 
        trio( scale(0.75,a), scale(0.75,c), scale(0.75,b) );
    }
}

function tetraSphere(n) {
    divideTrio(va,vb,vc,n);
    divideTrio(vd,vc,vb,n);
    divideTrio(va,vd,vb,n);
    divideTrio(va,vc,vd,n);
}

function shadedCube() {
    quadV( 1, 0, 3, 2 );
    quadV( 2, 3, 7, 6 );
    quadV( 3, 0, 4, 7 );
    quadV( 6, 5, 1, 2 );
    quadV( 4, 5, 6, 7 );
    quadV( 5, 4, 0, 1 );
}

function shadedDarkCube() {
    darkquadV( 1, 0, 3, 2 );
    darkquadV( 2, 3, 7, 6 );
    darkquadV( 3, 0, 4, 7 );
    darkquadV( 6, 5, 1, 2 );
    darkquadV( 4, 5, 6, 7 );
    darkquadV( 5, 4, 0, 1 );
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}


//--------------------------------------------------
function chooseArm(value) {
    arm = value;
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 0, 0, 0, 0 );
    //gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    gl.enable( gl.DEPTH_TEST ); 
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    
    gl.useProgram( program );

    shadedCube();
    //tetrahedron(va,vb,vc,vd,1);
    tetraSphere(6);
    
    // Load shaders and use the resulting shader program
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );    
    gl.useProgram( program );

    // Create and initialize  buffer objects    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    projection = ortho(-1, 1, -1, 1, -100, 100);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition));

    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);

    configureTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program,"texture"), 0);

    document.getElementById("sliderheadX").oninput = function() {
        octoheadstate[1][0] = event.srcElement.value;
    };
    document.getElementById("sliderheadY").oninput = function() {
        octoheadstate[1][1] = event.srcElement.value;
    };
    document.getElementById("sliderheadZ").oninput = function() {
        octoheadstate[1][2] = event.srcElement.value;
    };
    
    document.getElementById("sliderall").oninput = function() {
        for ( var i = 1; i <= 8; i++ ) {
            inputoctostate[i][0][0] = event.srcElement.value;
            inputoctostate[i][1][0] = event.srcElement.value;
            inputoctostate[i][2][0] = event.srcElement.value;
        }
   };
    document.getElementById("sliderYall").oninput = function() {
        for ( var i = 1; i <= 8; i++ ) {
            inputoctostate[i][0][1] = event.srcElement.value;
            inputoctostate[i][1][1] = event.srcElement.value;
            inputoctostate[i][2][1] = event.srcElement.value;
        }
    };
    document.getElementById("slidertopjo").oninput = function() {
        inputoctostate[arm][0][0] = event.srcElement.value;
    };
    document.getElementById("slidertopYjo").oninput = function() {
        inputoctostate[arm][0][1] = event.srcElement.value;
    };
    document.getElementById("slidermidjo").oninput = function() {
        inputoctostate[arm][1][0] = event.srcElement.value;
    };
    document.getElementById("slidermidYjo").oninput = function() {
        inputoctostate[arm][1][1] = event.srcElement.value;
    };
    document.getElementById("sliderlowjo").oninput = function() {
        inputoctostate[arm][2][0] = event.srcElement.value;
    };
    document.getElementById("sliderlowYjo").oninput = function() {
        inputoctostate[arm][2][1] = event.srcElement.value;
    };
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
    
    render();
}

//----------------------------------------------------------------------------


var swim = [];
{
    var octos = [[[0,0,0],[0,0,0]]  ,  [[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]]];

    for (var k = 0; k <= 150; k+=2) {
        for (var i = 1; i <= 8; i++) {
            octos[i][0][0] = k-20;
            octos[i][1][0] = k-20;
            octos[i][2][0] = k-20;
        }
        //octos[0][1][1] = 45*Math.sin(k/180);
        //octos[0][1][0] = 90*Math.sin(k/180);
        swim.push(structuredClone(octos));
    }
    for (var k = 150; k >= 0; k-=10) {
        for (var i = 1; i <= 8; i++) {
            octos[i][0][0] = k-20;
            octos[i][1][0] = k-20;
            octos[i][2][0] = k-20;

            //octos[i][0][1] = k-10;
            //octos[i][1][1] = -k+10;
            //octos[i][2][1] = k-10;
        }
        //octos[0][1][0] = 90*Math.sin(k/180);
        //octos[0][1][1] = 45*Math.sin(k/180);
        swim.push(structuredClone(octos));
    };
}

var wave = [];
{
    var octos = [[[0,0,0],[0,0,0]]  ,  [[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]],[[0,0], [0,0], [0,0]]];

    for (var k = 0; k <= 80; k+=2) {
        for (var i = 1; i <= 8; i++) {
            octos[i][0][0] = 90 * Math.sin((k + i*10)/1);
            octos[i][1][0] = -90 * Math.sin((k + i*20)/1);
            octos[i][2][0] = 90 * Math.sin((k + i*30)/1);

            //octos[i][0][1] = k-10;
            //octos[i][1][1] = -k+10;
            //octos[i][2][1] = k-10;
        }
        //octos[0][1][1] = 45*Math.sin(k/180);
        //octos[0][1][0] = 90*Math.sin(k/180);
        wave.push(structuredClone(octos));
    }
}

var frame_delay = 1;

function save_octostate() {
    octoanim.push(structuredClone(octostate));
}

function toggle_animation() {
    nextframe = 0;
    animate = !animate;
    if (!animate) { octoanim = [] }
}

function toggle_animation_custom() {
    frame_delay = 20;
    toggle_animation();
}

function toggle_animation1() {
    frame_delay = 1;
    octoanim = swim;
    toggle_animation();
}

function toggle_animation2() {
    frame_delay = 5;
    octoanim = wave;
    toggle_animation();
}

var nextframe = 0;
var animate = false;
function play_animation(flag) {
    if (flag && animate) {
        octostate = octoanim[nextframe];
        nextframe++;
        if ( nextframe >= octoanim.length ) {
            nextframe = 0;
        }
    }
}

function clear_anim() {
    octoanim = [];
    animate = false;
}

//----------------------------------------------------------------------------
function octohead() {
    var octoheadupper_base = scale4(0.8*OCTOHEAD_WIDTH, 1.3*OCTOHEAD_HEIGHT, OCTOHEAD_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 1.3*OCTOHEAD_HEIGHT, -0.2*OCTOHEAD_WIDTH ), octoheadupper_base);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, NumVerticesCube, NumVerticesSphere );

    var octoheadlower_base = scale4(0.6*OCTOHEAD_WIDTH, 0.6*OCTOHEAD_HEIGHT, 0.6*OCTOHEAD_WIDTH);
    instanceMatrix = mult( translate( 0.0, 0.5 * OCTOHEAD_HEIGHT, 0.0 ), octoheadlower_base);
    t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, NumVerticesCube, NumVerticesSphere );
}

function octoeyes() {
    tex_url = "https://i.imgur.com/QtlAMD2.jpg";

    var octorighteye_base = scale4(OCTOEYE_WIDTH, OCTOEYE_WIDTH, OCTOEYE_WIDTH);
    var instanceMatrix = mult( translate( 0.3 * OCTOHEAD_WIDTH, 0.4 * OCTOHEAD_HEIGHT, 0.5 * OCTOHEAD_WIDTH ), octorighteye_base);   // not gonna
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );

    var octolefteye_base = scale4(OCTOEYE_WIDTH, OCTOEYE_WIDTH, OCTOEYE_WIDTH);
    instanceMatrix = mult( translate( -0.3 * OCTOHEAD_WIDTH, 0.4 * OCTOHEAD_HEIGHT, 0.5 * OCTOHEAD_WIDTH ), octolefteye_base);   // not gonna
    t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );
    tex_url = "https://i.imgur.com/jyn9MIw.jpg";
    
}

function octoiris() {
    var irisRatio = 0.5;
    var octorightiris_base = scale4(irisRatio*OCTOEYE_WIDTH, irisRatio*OCTOEYE_WIDTH, irisRatio*OCTOEYE_WIDTH);
    var instanceMatrix = mult( translate( 0.3 * OCTOHEAD_WIDTH - 0.25*OCTOEYE_WIDTH, 0.4 * OCTOHEAD_HEIGHT + -0.1*OCTOEYE_WIDTH, 0.5*OCTOHEAD_WIDTH + 0.6*OCTOEYE_WIDTH ), octorightiris_base);   // not gonna
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );

    var octoleftiris_base = scale4(irisRatio*OCTOEYE_WIDTH, irisRatio*OCTOEYE_WIDTH, irisRatio*OCTOEYE_WIDTH);
    instanceMatrix = mult( translate( -0.3*OCTOHEAD_WIDTH + 0.25*OCTOEYE_WIDTH, 0.4 * OCTOHEAD_HEIGHT + 0.1*OCTOEYE_WIDTH, 0.5*OCTOHEAD_WIDTH + 0.6*OCTOEYE_WIDTH ), octoleftiris_base);   // not gonna
    t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );
}

//----------------------------------------------------------------------------
function octoarm() {
    var octoarm_base = scale4(OCTOARM_WIDTH, OCTOARM_LENGTH, OCTOARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * OCTOARM_LENGTH, 0.0 ), octoarm_base);   
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );
}

function octoshoulder() {
    var octoshoulder_base = scale4(OCTOARM_WIDTH, 0.7*OCTOARM_LENGTH, OCTOARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * OCTOARM_LENGTH, 0.0 ), octoshoulder_base);   
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCube );
}

//----------------------------------------------------------------------------
function octojoint() {
    var octojoint_base = scale4(OCTOJOINT_WIDTH, OCTOJOINT_WIDTH, OCTOJOINT_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * OCTOJOINT_WIDTH, 0.0 ), octojoint_base);    
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, NumVerticesCube, NumVerticesSphere );
}
//----------------------------------------------------------------------------

floating = true;
function toggle_float() {
    floating = !floating;
}

var timer = 0;

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    timer++;

    if (!animate){
        octostate = inputoctostate;
    }

    play_animation(timer % frame_delay == 0);

    floaterTX = Math.sin(timer/180);
    floaterTY = Math.cos(timer/90);
    floaterTZ = 0;
    floaterRX = Math.sin(timer/180);
    floaterRY = Math.cos(timer/90);
    floaterRZ = Math.sin(timer/180);
    floatrad = 5;

    if (!floating) {
        floaterTX = 0;
        floaterTY = 0;
        floaterTZ = 0;
        floatrad = 0;
    }

    modelViewMatrix = rotate(0, 0.5, 0.5, 0.5 );

    modelViewMatrix = mult(modelViewMatrix, rotate( octoheadstate[1][0], 1, 0, 0 ));
    modelViewMatrix = mult(modelViewMatrix, rotate( octoheadstate[1][1], 0, 1, 0 ));
    modelViewMatrix = mult(modelViewMatrix, rotate( octoheadstate[1][2], 0, 0, 1 ));

    modelViewMatrix = mult(modelViewMatrix, translate(floaterTX, floaterTY, floaterTZ));
    modelViewMatrix = mult(modelViewMatrix, rotate( floatrad, floaterRX, floaterRY, floaterRZ ));


    //console.log(thetas[iBase]);

    //base();
    octohead();
    octoeyes();
    octoiris();

    modelViewMatrix = mult(modelViewMatrix, rotate( 22.5, 0, 1, 0 ));

    var xshift = [-1, -1, -1, 1, 1,  1,  0, 0];
    var zshift = [ 1,  0, -1, 1, 0, -1, -1, 1];

    var rootmvm = modelViewMatrix;

    var monke = [1,-0.5,-0.3];
    //var monke = [1,1,1];
 
    for (var i = 0; i < 8; i++) {

        modelViewMatrix = mult(modelViewMatrix, rotate(180, 0.0, 0, 1 ));
        /*
        modelViewMatrix = mult(modelViewMatrix, rotate(45, zshift[i], 0, -1*xshift[i] ));
        modelViewMatrix = mult(modelViewMatrix, translate( 0.25*xshift[i] * OCTOHEAD_WIDTH, 0.0, 0.2 * zshift[i] * OCTOHEAD_WIDTH));
        octoshoulder();
        modelViewMatrix = mult(modelViewMatrix, translate( -0.25*xshift[i] * OCTOHEAD_WIDTH, 0.0, -0.2 * zshift[i] * OCTOHEAD_WIDTH));
        modelViewMatrix = mult(modelViewMatrix, rotate(-45, zshift[i], 0, -1*xshift[i] ));
        */
        modelViewMatrix = mult(modelViewMatrix, translate(0.5 * xshift[i] * OCTOHEAD_WIDTH, 0.0, 0.5 * zshift[i] * OCTOHEAD_WIDTH));
        modelViewMatrix = mult(modelViewMatrix, rotate( monke[0]* octostate[i+1][0][0], zshift[i], 0, -1*xshift[i] ));
        modelViewMatrix = mult(modelViewMatrix, rotate( octostate[i+1][0][1], 0, 1, 0 ));
        octojoint();
        octoarm();
        modelViewMatrix = mult(modelViewMatrix, translate(0.0, OCTOARM_LENGTH, 0.0)); 
        modelViewMatrix = mult(modelViewMatrix, rotate( monke[1]* octostate[i+1][1][0], zshift[i], 0, -1*xshift[i] ));
        modelViewMatrix = mult(modelViewMatrix, rotate( octostate[i+1][1][1], 0, 1, 0 ));
        //console.log(octostate[i+1][1][0]);
        octojoint();
        octoarm();
        modelViewMatrix = mult(modelViewMatrix, translate(0.0, OCTOARM_LENGTH, 0.0)); 
        modelViewMatrix = mult(modelViewMatrix, rotate( monke[2]* octostate[i+1][2][0], zshift[i], 0, -1*xshift[i] ));
        modelViewMatrix = mult(modelViewMatrix, rotate( octostate[i+1][2][1], 0, 1, 0 ));
        octojoint();
        octoarm();
        modelViewMatrix = rootmvm;
    }

    

    requestAnimFrame(render);
}



