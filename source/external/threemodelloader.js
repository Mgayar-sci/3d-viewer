OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
        this.importer.AddImporter (new OV.Importer3dm ());
        this.importer.AddImporter (new OV.ImporterIfc ());
        this.callbacks = null;
        this.inProgress = false;
        this.defaultMaterial = null;
        this.hasHighpDriverIssue = OV.HasHighpDriverIssue ();
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    LoadFromUrlList (urls, settings)
    {
        if (this.inProgress) {
            return;
        }

        let obj = this;
        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.importer.LoadFilesFromUrls (urls, function () {
            obj.OnFilesLoaded (settings);
        });
    }
    
    LoadFromFileList (files, settings)
    {
        if (this.inProgress) {
            return;
        }

        let obj = this;
        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.importer.LoadFilesFromFileObjects (files, function () {
            obj.OnFilesLoaded (settings);
        });
    }

    ReloadFiles (settings)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.OnFilesLoaded (settings);        
    }
    
    OnFilesLoaded (settings)
    {
        let obj = this;
        this.callbacks.onImportStart ();
        OV.RunTaskAsync (function () {
            obj.importer.Import (settings, {
                onSuccess : function (importResult) {
                    obj.OnModelImported (importResult);
                },
                onError : function (importError) {
                    obj.callbacks.onLoadError (importError);
                    obj.inProgress = false;
                }
            });
        });
    }

    OnModelImported (importResult)
    {
        let obj = this;
        this.callbacks.onVisualizationStart ();
        let params = new OV.ModelToThreeConversionParams ();
        params.forceMediumpForMaterials = this.hasHighpDriverIssue;
        let result = new OV.ModelToThreeConversionResult ();
        OV.ConvertModelToThreeMeshes (importResult.model, params, result, {
            onTextureLoaded : function () {
                obj.callbacks.onTextureLoaded ();
            },
            onModelLoaded : function (meshes) {
                obj.defaultMaterial = result.defaultMaterial;
                obj.callbacks.onModelFinished (importResult, meshes);
                obj.inProgress = false;
            }
        });
    }

    GetImporter ()
    {
        return this.importer;
    }
};
