function message(type, msg, disableLoader) {
    let p = document.createElement("p");
    p.innerText = msg;
    p.classList = [type];
    let div = document.getElementById("message");
    div.appendChild(p);
    setTimeout(() => {
        div.removeChild(p);
    }, 5000);
    if(disableLoader) {
        document.getElementById("loader").style.display = "none";
    }
}

function convert(file) {
    document.getElementById("loader").style.display = "inline-block";
    if(file.name.split(".").pop() != "gltf") {
        message("error", "Wrong file format! Use embedded gltf", true);
        return;
    }
    let reader = new FileReader();
    reader.onload = (event) => {
        try {
            let gltf = JSON.parse(event.target.result);
            parse(gltf).then((data) => {
                if(data != -1) {
                let amo = createAMO(data.name, data.vb, data.nb, data.ub, data.ib, data.jb, data.wb, data.animation);
                saveFile(data.name + ".amo", amo);
                message("success", "Successfully converted to AMO", true);
                }
            });
        } catch(e) {
            if(e instanceof SyntaxError) {
                message("error", "Invalid Syntax: " + e.message, true);
                return;
            } else {
                message("error", e.message, true);
                return;
            }
        }
    };
    reader.readAsText(file);
}

async function parse(gltf) {
    if(gltf.asset.version != "2.0") {
        message("error", "Wrong gltf version", true);
        return -1;
    }
    if(gltf.meshes.length != 1) {
        message("error", "can't have more than one mesh", true);
        return -1;
    }

    // Vertexbuffer aka v
    let vb_accessor = gltf.meshes[0].primitives[0].attributes.POSITION;
    let vb_bufferView = gltf.accessors[vb_accessor].bufferView;
    let vb_count = gltf.accessors[vb_accessor].count;
    let vb_buffer = gltf.bufferViews[vb_bufferView].buffer;
    let vb_start = gltf.bufferViews[vb_bufferView].byteOffset;
    let vb_stop = vb_start + gltf.bufferViews[vb_bufferView].byteLength;
    let vb_data = undefined;

    // Normalbuffer aka vn
    let nb_accessor = gltf.meshes[0].primitives[0].attributes.NORMAL;
    let nb_bufferView = gltf.accessors[nb_accessor].bufferView;
    let nb_count = gltf.accessors[nb_accessor].count;
    let nb_buffer = gltf.bufferViews[nb_bufferView].buffer;
    let nb_start = gltf.bufferViews[nb_bufferView].byteOffset;
    let nb_stop = nb_start + gltf.bufferViews[nb_bufferView].byteLength;
    let nb_data = undefined;

    // UVbuffer aka vt
    let ub_accessor = gltf.meshes[0].primitives[0].attributes.TEXCOORD_0;
    let ub_bufferView = gltf.accessors[ub_accessor].bufferView;
    let ub_count = gltf.accessors[ub_accessor].count;
    let ub_buffer = gltf.bufferViews[ub_bufferView].buffer;
    let ub_start = gltf.bufferViews[ub_bufferView].byteOffset;
    let ub_stop = ub_start + gltf.bufferViews[ub_bufferView].byteLength;
    let ub_data = undefined;

    // Indexbuffer aka f
    let ib_accessor = gltf.meshes[0].primitives[0].indices;
    let ib_bufferView = gltf.accessors[ib_accessor].bufferView;
    let ib_count = gltf.accessors[ib_accessor].count;
    let ib_buffer = gltf.bufferViews[ib_bufferView].buffer;
    let ib_start = gltf.bufferViews[ib_bufferView].byteOffset;
    let ib_stop = ib_start + gltf.bufferViews[ib_bufferView].byteLength;
    let ib_data = undefined;

    // Jointbuffer aka vj
    let jb_accessor = gltf.meshes[0].primitives[0].attributes.JOINTS_0;
    let jb_bufferView = gltf.accessors[jb_accessor].bufferView;
    let jb_count = gltf.accessors[jb_accessor].count;
    let jb_buffer = gltf.bufferViews[jb_bufferView].buffer;
    let jb_start = gltf.bufferViews[jb_bufferView].byteOffset;
    let jb_stop = jb_start + gltf.bufferViews[jb_bufferView].byteLength;
    let jb_data = undefined;

    // Weightbuffer aka vw
    let wb_accessor = gltf.meshes[0].primitives[0].attributes.WEIGHTS_0;
    let wb_bufferView = gltf.accessors[wb_accessor].bufferView;
    let wb_count = gltf.accessors[wb_accessor].count;
    let wb_buffer = gltf.bufferViews[wb_bufferView].buffer;
    let wb_start = gltf.bufferViews[wb_bufferView].byteOffset;
    let wb_stop = wb_start + gltf.bufferViews[wb_bufferView].byteLength;
    let wb_data = undefined;

    // The animation object
    let animation = {};
    animation.name = gltf.animations[0].name;
    if(animation.name == undefined) {
        message("warning", "Animation not found", false);
    } else {
        animation.joints = [];
        // Load every joint and select their parents
        for(let i = 0; i < gltf.skins[0].joints.length; i++) {
            animation.joints[i] = {};
            animation.joints[i].index = gltf.skins[0].joints[i];
            animation.joints[i].name = gltf.nodes[animation.joints[i].index].name;
            animation.joints[i].children = gltf.nodes[animation.joints[i].index].children;
            if(animation.joints[i].children != undefined) {
                for(let j = 0; j < animation.joints[i].children.length; j++) {
                    animation.joints[animation.joints[i].children[j]].parent = i; 
                }
            }
        }
        // The animation samplers, which contains to buffers: the timestamps and the values the attribute should have at that timestamp
        animation.samplers = [];
        for(let i = 0; i < gltf.animations[0].samplers.length; i++) {
            animation.samplers[i] = {};
            animation.samplers[i].timeBuffer = {};
            animation.samplers[i].timeBuffer.accessor = gltf.animations[0].samplers[i].input;
            animation.samplers[i].timeBuffer.bufferView = gltf.accessors[animation.samplers[i].timeBuffer.accessor].bufferView;
            animation.samplers[i].timeBuffer.count = gltf.accessors[animation.samplers[i].timeBuffer.accessor].count;
            animation.samplers[i].timeBuffer.buffer = gltf.bufferViews[animation.samplers[i].timeBuffer.bufferView].buffer;
            animation.samplers[i].timeBuffer.start = gltf.bufferViews[animation.samplers[i].timeBuffer.bufferView].byteOffset;
            animation.samplers[i].timeBuffer.stop = animation.samplers[i].timeBuffer.start + gltf.bufferViews[animation.samplers[i].timeBuffer.bufferView].byteLength;
            animation.samplers[i].timeBuffer.data = undefined;
    
            animation.samplers[i].valueBuffer = {};
            animation.samplers[i].valueBuffer.accessor = gltf.animations[0].samplers[i].output;
            animation.samplers[i].valueBuffer.bufferView = gltf.accessors[animation.samplers[i].valueBuffer.accessor].bufferView;
            animation.samplers[i].valueBuffer.count = gltf.accessors[animation.samplers[i].valueBuffer.accessor].count;
            animation.samplers[i].valueBuffer.buffer = gltf.bufferViews[animation.samplers[i].valueBuffer.bufferView].buffer;
            animation.samplers[i].valueBuffer.start = gltf.bufferViews[animation.samplers[i].valueBuffer.bufferView].byteOffset;
            animation.samplers[i].valueBuffer.stop = animation.samplers[i].valueBuffer.start + gltf.bufferViews[animation.samplers[i].valueBuffer.bufferView].byteLength;
            animation.samplers[i].valueBuffer.data = undefined;
        }
        // The animation channels. They determine, which attribute of which joint should be used for the sampler
        animation.channels = [];
        for(let i = 0; i < gltf.animations[0].channels.length; i++) {
            animation.channels[i] = {};
            animation.channels[i].joint = gltf.animations[0].channels[i].target.node;
            animation.channels[i].sampler = gltf.animations[0].channels[i].sampler;
            animation.channels[i].path = gltf.animations[0].channels[i].target.path;
        }
    }
    // Fetch every gltfbuffer and load the data for each buffer
    for(let i = 0; i < gltf.buffers.length; i++) {
        let res = await fetch(gltf.buffers[i].uri);
        let data = await res.arrayBuffer();
        if(vb_buffer == i) {
            vb_data = new Float32Array(data.slice(vb_start, vb_stop));
        }
        if(nb_buffer == i) {
            nb_data = new Float32Array(data.slice(nb_start, nb_stop));
        }
        if(ub_buffer == i) {
            ub_data = new Float32Array(data.slice(ub_start, ub_stop));
        }
        if(ib_buffer == i) {
            ib_data = new Uint16Array(data.slice(ib_start, ib_stop));
        }
        if(jb_buffer == i) {
            if(gltf.accessors[jb_accessor].componentType == 5121) {
                jb_data = new Uint8Array(data.slice(jb_start, jb_stop));
            } else {
                jb_data = new Uint16Array(data.slice(jb_start, jb_stop));
            }
        }
        if(wb_buffer == i) {
            wb_data = new Float32Array(data.slice(wb_start, wb_stop));
        }
        if(animation.name != undefined) {
            for(let j = 0; j < animation.samplers.length; j++) {
                if(animation.samplers[j].timeBuffer.buffer == i) {
                    animation.samplers[j].timeBuffer.data = new Float32Array(data.slice(animation.samplers[j].timeBuffer.start, animation.samplers[j].timeBuffer.stop));
                }
                if(animation.samplers[j].valueBuffer.buffer == i) {
                    if(gltf.accessors[animation.samplers[j].valueBuffer.accessor].componentType == 5126) {
                        animation.samplers[j].valueBuffer.data = new Float32Array(data.slice(animation.samplers[j].valueBuffer.start, animation.samplers[j].valueBuffer.stop));
                    }
                }
            }
        }
    }
    let vb = {"data": vb_data, "count": vb_count};
    let nb = {"data": nb_data, "count": nb_count};
    let ub = {"data": ub_data, "count": ub_count};
    let ib = {"data": ib_data, "count": ib_count};
    let jb = {"data": jb_data, "count": jb_count};
    let wb = {"data": wb_data, "count": wb_count};
    let data = { "name": gltf.meshes[0].name,
    "vb": vb,
    "nb": nb,
    "ub": ub,
    "ib": ib,
    "jb": jb,
    "wb": wb,
    "animation": animation
   };
    return data;
}

// Generate the AMO file based on the buffers the parser previously determined
function createAMO(name, vb, nb, ub, ib, jb, wb, animation) {
    // Header
    let AMO = "#Generated by editamo\n";
    AMO += `ao ${name}\n\n`;

    // Vertexbuffer aka v
    for(let i = 0; i < vb.count; i++) {
        AMO += `v ${vb.data[i*3]} ${vb.data[i*3+1]} ${vb.data[i*3+2]}\n`;
    }
    AMO += "\n";

    // Normalbuffer aka vn
    for(let i = 0; i < nb.count; i++) {
        AMO += `vn ${nb.data[i*3]} ${nb.data[i*3+1]} ${nb.data[i*3+2]}\n`;
    }
    AMO += "\n";

    // UVbuffer aka vt
    for(let i = 0; i < ub.count; i++) {
        AMO += `vt ${ub.data[i*2]} ${ub.data[i*2+1]}\n`;
    }
    AMO += "\n";

    // Jointbuffer aka vj
    for(let i = 0; i < jb.count; i++) {
        AMO += `vj ${jb.data[i*4]+1} ${jb.data[i*4+1]+1} ${jb.data[i*4+2]+1} ${jb.data[i*4+3]+1}\n`;
    }
    AMO += "\n";

    // Weightbuffer aka vw
    for(let i = 0; i < wb.count; i++) {
        AMO += `vw ${wb.data[i*4]} ${wb.data[i*4+1]} ${wb.data[i*4+2]} ${wb.data[i*4+3]}\n`;
    }
    AMO += "\n";

    // Indexbuffer aka f
    for(let i = 0; i < ib.count/3; i++) {
        AMO += `f ${ib.data[i*3]+1}/${ib.data[i*3]+1}/${ib.data[i*3]+1}/${ib.data[i*3]+1}/${ib.data[i*3]+1} `;
        AMO += `${ib.data[i*3+1]+1}/${ib.data[i*3+1]+1}/${ib.data[i*3+1]+1}/${ib.data[i*3+1]+1}/${ib.data[i*3+1]+1} `;
        AMO += `${ib.data[i*3+2]+1}/${ib.data[i*3+2]+1}/${ib.data[i*3+2]+1}/${ib.data[i*3+2]+1}/${ib.data[i*3+2]+1}\n`;
    }
    AMO += "\n";

    // Joints aka j
    for(let i = 0; i < animation.joints.length; i++) {
        if(animation.joints[i].parent != undefined) {
            AMO += `j ${animation.joints[i].name} ${animation.joints[i].parent}\n`;
        } else {
            AMO += `j ${animation.joints[i].name} -1\n`;
        }
    }
    AMO += "\n";

    // Animation
    if(animation.name != undefined) {
        AMO += `a ${animation.name}\n\n`;
        for(let i = 0; i < animation.channels.length; i++) {
            let sampler = animation.samplers[animation.channels[i].sampler];
            for(let j = 0; j < sampler.timeBuffer.count; j++) {
                // Position aka ap
                if(animation.channels[i].path == "translation") {
                    AMO += `ap ${sampler.timeBuffer.data[j]} ${animation.channels[i].joint+1} ${sampler.valueBuffer.data[j*3]} ${sampler.valueBuffer.data[j*3+1]} ${sampler.valueBuffer.data[j*3+2]}\n`;
                // Rotation aka ar
                } else if(animation.channels[i].path == "rotation") {
                    AMO += `ar ${sampler.timeBuffer.data[j]} ${animation.channels[i].joint+1} ${sampler.valueBuffer.data[j*4]} ${sampler.valueBuffer.data[j*4+1]} ${sampler.valueBuffer.data[j*4+2]} ${sampler.valueBuffer.data[j*4+3]}\n`;
                }
            }
        }
    }
    return AMO;
}

function saveFile(filename, content) {
    let file = new Blob([content], {type: "text/plain"});
    let a = document.createElement("a");
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 0);
}