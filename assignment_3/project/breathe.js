var points = [];
//var colors = [];
var normals = [];

var textures = [];

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;
var changedLightPos;
var modelViewMatrixLoc, lightPositionLoc;
var vBuffer, cBuffer, nBuffer, tBuffer;
var vNormal, vTexCoord;
var cubeMap;
var lightPosition = vec4(0.0, 5.0, 2.0, 0.0);

var ambientColor = vec3(1.0, 0.2, 0.5);
var diffuseColor = vec3(1.0, 1.0, 1.0);
var specularColor = vec3(1.0, 1.0, 1.0);

var ambientCoeff = 0.5;
var diffuseCoeff = 0.5;
var specularCoeff = 0.0;

var materialShininess = 10.0;

//var projection;
var viewerPos;
var program;
//----------------------------------------------------------------------------

var rotX = 0;
var rotY = 45;
var rotZ = 45;

var zoom = 1;

var rotL = 0;

//var aa = 0.94280904158 // aa value to make w = 1/3
var aa = 0.6
var w; // define here for now

var udiv = 400;
var vdiv = 400;

var umin = -20
var umax = 20
var vmin = 0
var vmax = 32

var mode = 0; // default mode (see enum)

const Mode = {
	Grid: 0,
	Gouraud: 1,
	Phong: 2
}

function change_mode() {
    mode = (mode + 1) % 3;
    initProgram();
    breathe();
}

var maxRot = 6;
var rotationSpeed = 0

function toggle_Yrotation() {
    rotationSpeed = (rotationSpeed + 2) % (maxRot);
}

function initProgram() {
    if (mode == 0 || mode == 1) {
        program = initShaders( gl, "vertex-shader-gouraud", "fragment-shader-gouraud" );
    }
    else if (mode == 2) {
        program = initShaders( gl, "vertex-shader-phong", "fragment-shader-phong" );
    }
    gl.useProgram( program );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    //
    //cBuffer = gl.createBuffer();
    //gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    //var vColor = gl.getAttribLocation( program, "vColor" );
    //gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vColor );
    //
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);

    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    initCubeMap();

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    // Texture map
    initText();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));
    gl.uniform3fv(gl.getUniformLocation(program, "ambientColor"),flatten(ambientColor));
    gl.uniform3fv(gl.getUniformLocation(program, "diffuseColor"),flatten(diffuseColor));
    gl.uniform3fv(gl.getUniformLocation(program, "specularColor"),flatten(specularColor));

    gl.uniform1f(gl.getUniformLocation(program, "ambientCoeff"), ambientCoeff);
    gl.uniform1f(gl.getUniformLocation(program, "diffuseCoeff"), diffuseCoeff);
    gl.uniform1f(gl.getUniformLocation(program, "specularCoeff"), specularCoeff);
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
    //ambCoLoc = gl.getUniformLocation(program, "ambientCoeff");
    //difCoLoc = gl.getUniformLocation(program, "diffuseCoeff");
    //speCoLoc = gl.getUniformLocation(program, "specularCoeff");
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
}

function breathe() {
    w = Math.sqrt(1 - aa*aa);
    if (mode == Mode.Grid) {
        breatheQuadsGrid(createUVpoints(umin,umax,vmin,vmax));
    }
    else if (mode == Mode.Phong) {
        breatheQuadsPhong(createUVpoints(umin,umax,vmin,vmax));
    }
    else if (mode == Mode.Gouraud) {
        breatheQuadsGouraud(createUVpoints(umin,umax,vmin,vmax));
    }
}

function uv_to_xyz(u,v) {
    var x, y, z;

    var coshaau = Math.cosh(aa*u);
    //console.log(coshaau);

    var denom = aa * (Math.pow( w * coshaau, 2 ) + Math.pow( aa * Math.sin(w*v), 2 ));

    x = -u + (2 * ( 1 - aa*aa ) * coshaau * Math.sinh(aa*u) / denom);

    y = 2 * w * coshaau * ( - w * Math.cos(v) * Math.cos(w*v) - Math.sin(v) * Math.sin(w*v) ) / denom;

    z = 2 * w * coshaau * ( - w * Math.sin(v) * Math.cos(w*v) + Math.cos(v) * Math.sin(w*v) ) / denom;

    //if ( u == 0 && v == 0) { console.log(x + " " + y + " " + z); }

    return vec4( x, y, z, 1.0);
}

function createUVpoints(ulow,uhigh,vlow,vhigh) {

    var uinc = (uhigh-ulow) / udiv;
    var vinc = (vhigh-vlow) / vdiv;

    //if (data != [])
    //    data = [];

    var data = new Array(udiv+1);
    for(var i = 0; i < udiv+1; i++) data[i] = new Array(vdiv+1);

    var i = 0;
    var j;

    for ( var ucur = ulow; ucur <= uhigh; ucur += uinc) {
        j = 0;
        for ( var vcur = vlow; vcur <= vhigh; vcur += vinc) {
            //console.log(i + " " + j);
            data[i][j] = uv_to_xyz(ucur,vcur);
            j += 1;
        }
        i += 1;
    }

    return data;
}

function breatheQuadsGrid(data) {
    points = [];
    //colors = [];
    normals = [];

    var lastXpositive = true;
    var countBorderCross = 0;

    for ( var i = 0; i < udiv-1; i++) {
        if ( (lastXpositive && data[i][0][0] < 0) || (!lastXpositive && data[i][0][0] > 0) ) {
            lastXpositive = !lastXpositive;
            countBorderCross += 1;
        }
        for ( var j = 0; j < vdiv-1; j++) {

            var t1 = subtract(data[i+1][j], data[i][j]);
            var t2 = subtract(data[i+1][j+1], data[i][j]);
            var normal = cross(t1, t2);
 
            normal = normalize(normal);

            if (countBorderCross >= 1 && countBorderCross <= 2) { normal = scale(-1,normal);}

            points.push(data[i][j]);
            //textures.push(data[i][j]);
            //colors.push(color);
            normals.push(normal);

            points.push(data[i + 1][j]);
            //textures.push(data[i + 1][j]);
            //colors.push(color);
            normals.push(normal);
            //
            points.push(data[i + 1][j]);
            //textures.push(data[i + 1][j]);
            //colors.push(color);
            normals.push(normal);

            points.push(data[i + 1][j + 1]);
            //textures.push(data[i + 1][j + 1]);
            //colors.push(color);
            normals.push(normal);
            //
            
        }
    }
    isBufferUpdated = true;
}

function breatheQuadsPhong(data) {
    points = [];
    //colors = [];
    normals = [];

    var normalData = findNormals(data);

    for ( var i = 0; i < udiv-1; i++) {

        for ( var j = 0; j < vdiv-1; j++) {

            points.push(data[i][j]);
            textures.push(data[i][j]);
            //colors.push(color);
            normals.push(normalData[i][j]);

            points.push(data[i+1][j]);
            textures.push(data[i+1][j]);
            //colors.push(color);
            normals.push(normalData[i+1][j]);

            points.push(data[i+1][j+1]);
            textures.push(data[i+1][j+1]);
            //colors.push(color);
            normals.push(normalData[i+1][j+1]);
            //
            points.push(data[i][j]);
            textures.push(data[i][j]);
            //colors.push(color);
            normals.push(normalData[i][j]);

            points.push(data[i+1][j+1]);
            textures.push(data[i+1][j+1]);
            //colors.push(color);
            normals.push(normalData[i+1][j+1]);

            points.push(data[i][j+1]);
            textures.push(data[i][j+1]);
            //colors.push(color);
            normals.push(normalData[i][j+1]);
            //
            
        }
    }

    isBufferUpdated = true;
}

function breatheQuadsGouraud(data) {
    points = [];
    //colors = [];
    normals = [];

    var normalData = findNormals(data);

    for ( var i = 0; i < udiv-1; i++) {
        for ( var j = 0; j < vdiv-1; j++) {

            points.push(data[i][j]);
            textures.push(data[i][j]);
            //colors.push(color);
            normals.push(normalData[i][j]);

            points.push(data[i + 1][j]);
            textures.push(data[i+1][j]);
            //colors.push(color);
            normals.push(normalData[i+1][j]);

            points.push(data[i + 1][j + 1]);
            textures.push(data[i+1][j+1]);
            //colors.push(color);
            normals.push(normalData[i+1][j+1]);
            //
            points.push(data[i][j]);
            textures.push(data[i][j]);
            //colors.push(color);
            normals.push(normalData[i][j]);

            points.push(data[i + 1][j + 1]);
            textures.push(data[i+1][j+1]);
            //colors.push(color);
            normals.push(normalData[i+1][j+1]);

            points.push(data[i][j + 1]);
            textures.push(data[i][j+1]);
            //colors.push(color);
            normals.push(normalData[i][j+1]);
            //
            
        }
    }

    isBufferUpdated = true;
}

// normals fixed and correctly reversed
function findNormals(data) {
    var normalData = new Array(udiv+1);
    for(var i = 0; i < udiv+1; i++) normalData[i] = new Array(vdiv+1);

    var lastXpositive = true;
    var countBorderCross = 0;

    for ( var i = 0; i < udiv; i++) {
        if ( (lastXpositive && data[i][0][0] < 0) || (!lastXpositive && data[i][0][0] > 0) ) {
            lastXpositive = !lastXpositive;
            countBorderCross += 1;
        }
        for ( var j = 0; j < vdiv; j++) {

            var ip1 = (i+1)%(udiv);
            var im1 = (i+udiv-1)%(udiv);
            var jp1 = (j+1)%(vdiv);
            var jm1 = (j+vdiv-1)%(vdiv);

            var t1 = subtract(data[ip1][j], data[i][j]);
            var t2 = subtract(data[ip1][jp1], data[i][j]);
            var normal = cross(t1, t2);
            normal = normalize(normal);
            
            var sumNormals = normal;

            // now the second (i gets -1)

            t1 = subtract(data[i][j], data[im1][j]);
            t2 = subtract(data[i][jp1], data[im1][j]);
            normal = cross(t1, t2);
            normal = normalize(normal);

            sumNormals = add(sumNormals,normal);

            // now the third (j gets -1)

            t1 = subtract(data[ip1][jm1], data[i][jm1]);
            t2 = subtract(data[ip1][j], data[i][jm1]);
            normal = cross(t1, t2);
            normal = normalize(normal);

            sumNormals = add(sumNormals,normal);

            // now the fourth (both get -1)

            t1 = subtract(data[i][jm1], data[im1][jm1]);
            t2 = subtract(data[i][j], data[im1][jm1]);
            normal = cross(t1, t2);
            normal = normalize(normal);

            sumNormals = add(sumNormals,normal);

            // avg
            if (countBorderCross >= 1 && countBorderCross <= 2){ 
                normalData[i][j] = scale(-0.25,sumNormals);
            }
            else {
                normalData[i][j] = scale(0.25,sumNormals);
            }

            //console.log(normalData[i][j])
        }
    }
    return normalData;
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
    viewerPos = vec3(0.0, 0.0, -20.0);
    //projection = ortho(-1, 1, -1, 1, -100, 100);
    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);

    initProgram();
    breathe();
    
    document.getElementById("rotX").oninput = function() {
        rotX = event.srcElement.value;
    };
    document.getElementById("rotY").oninput = function() {
        rotY = event.srcElement.value;
    };
    document.getElementById("rotZ").oninput = function() {
        rotZ = event.srcElement.value;
    };

    document.getElementById("zoom").oninput = function() {
        zoom = event.srcElement.value;
    };
    
    document.getElementById("aa").oninput = function() {
        aa = event.srcElement.value;
        breathe();
    };

    document.getElementById("urange").oninput = function() {
        umax = event.srcElement.value / 2;
        umin = -1 * umax;
        breathe();
    };

    document.getElementById("vrange").oninput = function() {
        vmax = event.srcElement.value;
        vmin = 0;
        breathe();
    };

    /*
    document.getElementById("detail_level").oninput = function() {
        udiv = event.srcElement.value;
        vdiv = udiv;
        breathe();
    };

    document.getElementById("rotL").oninput = function() {
        rotL = event.srcElement.value;
    };
    */

    /*
    document.getElementById("ambientCoeff").oninput = function() {
        ambientCoeff = event.srcElement.value;
    };
    document.getElementById("diffuseCoeff").oninput = function() {
        diffuseCoeff = event.srcElement.value;
    };
    document.getElementById("specularCoeff").oninput = function() {
        specularCoeff = event.srcElement.value;
    };
    */
    
    
    render();
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

var timer = 0;
var isBufferUpdated;
var toggledRotY = 0;

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    //colors = []
    //points = []
    //normals = []

    timer++;

    //console.log(aa)
    w = Math.sqrt(1 - aa*aa);

    if (rotationSpeed > 0)
        toggledRotY += rotationSpeed;


    if (isBufferUpdated) {
        // Update the vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        // Update the color buffer
        //gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        //gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        // Update the normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        isBufferUpdated = false;
    }
        
    changedLightPos = mult(lightPosition, rotate(rotL,0,1,0));

    modelViewMatrix = scale4(zoom,zoom,zoom);
    modelViewMatrix = mult(modelViewMatrix, rotate( rotX, 1, 0, 0 ));

    if (rotationSpeed > 0)
        modelViewMatrix = mult(modelViewMatrix, rotate( toggledRotY, 0, 1, 0 ));
    else
        modelViewMatrix = mult(modelViewMatrix, rotate( rotY, 0, 1, 0 ));

    modelViewMatrix = mult(modelViewMatrix, rotate( rotZ, 0, 0, 1 ));

    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(modelViewMatrix) );
    //gl.uniform4fv(lightPositionLoc, flatten(changedLightPos));
    //gl.uniform1f( ambCoLoc,  false, flatten(ambientCoeff) );
    //gl.uniform1f( difCoLoc,  false, flatten(diffuseCoeff) );
    //gl.uniform1f( speCoLoc,  false, flatten(specularCoeff) );

    if (mode == Mode.Grid)
        gl.drawArrays( gl.LINES, 0, udiv*vdiv*4 );
    else if (mode == Mode.Gouraud || mode == Mode.Phong)
        gl.drawArrays( gl.TRIANGLES, 0, udiv*vdiv*6 );

    //
    
    requestAnimFrame(render);
}

function initCubeMap() {

    var texSize = 64;

    var temp = new Array();
    for (var i = 0; i < texSize; i++)
        temp[i] = new Array();

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
            temp[i][j] = new Float32Array(4);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
            temp[i][j] = [c, c, c, 1];
        }
    }

    // Convert floats to ubytes for texture
    var pattern = new Uint8Array(4 * texSize * texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
            for (var k = 0; k < 4; k++)
                pattern[4 * texSize * i + 4 * j + k] = 255 * temp[i][j][k];

    cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pattern);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function initText() {
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

}



