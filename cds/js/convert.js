function convert(gltfModel) {
    let vertexBuffer = {};
    vertexBuffer.accessor = gltfModel.meshes[0].primitives[0].attributes.POSITION;
    vertexBuffer.bufferView = gltfModel.accessors[vertexBuffer.accessor].bufferView;
    vertexBuffer.vertexCount = gltfModel.accessors[vertexBuffer.accessor].count;
    vertexBuffer.buffer = gltfModel.bufferViews[vertexBuffer.bufferView].buffer;
    vertexBuffer.start = gltfModel.bufferViews[vertexBuffer.bufferView].byteOffset;
    vertexBuffer.stop = vertexBuffer.start + gltfModel.bufferViews[vertexBuffer.bufferView].byteLength;

    let normalBuffer = {};
    normalBuffer.accessor = gltfModel.meshes[0].primitives[0].attributes.NORMAL;
    normalBuffer.bufferView = gltfModel.accessors[normalBuffer.accessor].bufferView;
    normalBuffer.normalCount = gltfModel.accessors[normalBuffer.accessor].count;
    normalBuffer.buffer = gltfModel.bufferViews[normalBuffer.bufferView].buffer;
    normalBuffer.start = gltfModel.bufferViews[normalBuffer.bufferView].byteOffset;
    normalBuffer.stop = normalBuffer.start + gltfModel.bufferViews[normalBuffer.bufferView].byteLength;

    let uvBuffer = {};
    uvBuffer.accessor = gltfModel.meshes[0].primitives[0].attributes.TEXCOORD_0;
    uvBuffer.bufferView = gltfModel.accessors[uvBuffer.accessor].bufferView;
    uvBuffer.uvCount = gltfModel.accessors[uvBuffer.accessor].count;
    uvBuffer.buffer = gltfModel.bufferViews[uvBuffer.bufferView].buffer;
    uvBuffer.start = gltfModel.bufferViews[uvBuffer.bufferView].byteOffset;
    uvBuffer.stop = uvBuffer.start + gltfModel.bufferViews[uvBuffer.bufferView].byteLength;

    let indexBuffer = {};
    indexBuffer.accessor = gltfModel.meshes[0].primitives[0].indices;
    indexBuffer.bufferView = gltfModel.accessors[indexBuffer.accessor].bufferView;
    indexBuffer.indexCount = gltfModel.accessors[indexBuffer.accessor].count;
    indexBuffer.buffer = gltfModel.bufferViews[indexBuffer.bufferView].buffer;
    indexBuffer.start = gltfModel.bufferViews[indexBuffer.bufferView].byteOffset;
    indexBuffer.stop = indexBuffer.start + gltfModel.bufferViews[indexBuffer.bufferView].byteLength;

    fetch(gltfModel.buffers[0].uri).then((res) => {
        res.arrayBuffer().then((data) => {
            vertexBuffer.data = new Float32Array(data.slice(vertexBuffer.start, vertexBuffer.stop));
            normalBuffer.data = new Float32Array(data.slice(normalBuffer.start, normalBuffer.stop));
            uvBuffer.data = new Float32Array(data.slice(uvBuffer.start, uvBuffer.stop));
            indexBuffer.data = new Uint16Array(data.slice(indexBuffer.start, indexBuffer.stop));
        });
    });
};