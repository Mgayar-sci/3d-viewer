OV.ImporterO3dv = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }
    
    CanImportExtension (extension)
    {
        return extension === 'o3dv';
    }

    GetUpDirection ()
    {
        return OV.Direction.Z;
    }
    
    ClearContent ()
    {
        
    }

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {
        let textContent = OV.ArrayBufferToUtf8String (fileContent);
        let content = JSON.parse (textContent);
        if (content.materials !== undefined) {
            for (let i = 0; i < content.materials.length; i++) {
                const materialContent = content.materials[i];
                this.ImportMaterial (materialContent);
            }
        }
        if (content.meshes !== undefined) {
            for (let i = 0; i < content.meshes.length; i++) {
                const meshContent = content.meshes[i];
                this.ImportMesh (meshContent);
            }
        }
        if (content.root !== undefined) {
            this.ImportNode (content.root, this.model.GetRootNode ());
        }
        onFinish ();
    }

    ImportMaterial (materialContent)
    {
        let material = new OV.Material (OV.MaterialType.Physical);
        material.color.Set (255, 255, 255);
        if (materialContent.name !== undefined) {
            material.name = materialContent.name;
        }
        if (materialContent.color !== undefined) {
            material.color = OV.ArrayToColor (materialContent.color);
        }
        material.metalness = OV.ValueOrDefault (materialContent.metalness, 0.0);
        material.roughness = OV.ValueOrDefault (materialContent.roughness, 1.0);
        this.model.AddMaterial (material);
    }

    ImportMesh (meshContent)
    {
        let genParams = new OV.GeneratorParams ();
        if (meshContent.name !== undefined) {
            genParams.SetName (meshContent.name);
        }
        if (meshContent.material !== undefined) {
            genParams.SetMaterial (meshContent.material);
        }
        // TODO: remove transformation from mesh, and from generator
        if (meshContent.transformation !== undefined) {
            let translation = new OV.Coord3D (0.0, 0.0, 0.0);
            let rotation = new OV.Quaternion (0.0, 0.0, 0.0, 1.0);
            let scale = new OV.Coord3D (1.0, 1.0, 1.0);
            if (meshContent.transformation.translation !== undefined) {
                translation = OV.ArrayToCoord3D (meshContent.transformation.translation);
            }
            if (meshContent.transformation.rotation !== undefined) {
                rotation = OV.ArrayToQuaternion (meshContent.transformation.rotation);
            }
            if (meshContent.transformation.scale !== undefined) {
                scale = OV.ArrayToCoord3D (meshContent.transformation.scale);
            }
            genParams.SetTransformation (translation, rotation, scale);
        }

        let parameters = meshContent.parameters;
        if (parameters === undefined) {
            return;
        }

        let mesh = null;
        if (meshContent.type === 'cuboid') {
            if (parameters.size_x === undefined || parameters.size_y === undefined || parameters.size_z === undefined) {
                return;
            }
            mesh = OV.GenerateCuboid (genParams, parameters.size_x, parameters.size_y, parameters.size_z);
        } else if (meshContent.type === 'cylinder') {
            if (parameters.radius === undefined || parameters.height === undefined) {
                return;
            }
            let segments = OV.ValueOrDefault (parameters.segments, 25);
            let smooth = OV.ValueOrDefault (parameters.smooth, true);
            mesh = OV.GenerateCylinder (genParams, parameters.radius, parameters.height, segments, smooth);
        } else if (meshContent.type === 'sphere') {
            if (parameters.radius === undefined) {
                return;
            }
            let segments = OV.ValueOrDefault (parameters.segments, 20);
            let smooth = OV.ValueOrDefault (parameters.smooth, true);
            mesh = OV.GenerateSphere (genParams, parameters.radius, segments, smooth);
        } else if (meshContent.type === 'platonic') {
            if (parameters.solid_type === undefined) {
                return;
            }
            let radius = OV.ValueOrDefault (parameters.radius, 1.0);
            mesh = OV.GeneratePlatonicSolid (genParams, parameters.solid_type, radius);
        }
        if (mesh !== null) {
            this.model.AddMesh (mesh);
        }
    }

    ImportNode (node, meshNode)
    {
        if (node.name !== undefined) {
            meshNode.SetName (node.name);
        }
        if (node.transformation !== undefined) {
            const nodeTransformation = this.GetTransformation (node.transformation);
            meshNode.SetTransformation (nodeTransformation);
        }
        if (node.meshes !== undefined) {
            for (const meshIndex of node.meshes) {
                meshNode.AddMeshIndex (meshIndex);
            }
        }
        if (node.children !== undefined) {
            for (const child of node.children) {
                let childMeshNode = new OV.Node ();
                meshNode.AddChildNode (childMeshNode);
                this.ImportNode (child, childMeshNode);
            }
        }
    }

    GetTransformation (contentTransformation)
    {
        let translation = new OV.Coord3D (0.0, 0.0, 0.0);
        let rotation = new OV.Quaternion (0.0, 0.0, 0.0, 1.0);
        let scale = new OV.Coord3D (1.0, 1.0, 1.0);
        if (contentTransformation.translation !== undefined) {
            translation = OV.ArrayToCoord3D (contentTransformation.translation);
        }
        if (contentTransformation.rotation !== undefined) {
            rotation = OV.ArrayToQuaternion (contentTransformation.rotation);
        }
        if (contentTransformation.scale !== undefined) {
            scale = OV.ArrayToCoord3D (contentTransformation.scale);
        }
        const matrix = new OV.Matrix ().ComposeTRS (translation, rotation, scale);
        return new OV.Transformation (matrix);
    }
};
