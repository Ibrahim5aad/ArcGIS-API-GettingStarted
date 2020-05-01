require(["esri/Map", "esri/views/MapView", "esri/widgets/BasemapGallery",
         "esri/WebMap", "esri/layers/FeatureLayer", "esri/renderers/ClassBreaksRenderer", "esri/request"], 
        function(Map, MapView, BasemapGallery, WebMap, FeatureLayer, Renderer, esriRequest) {


    var myRenderer = {
        type: "class-breaks",
        field: "POP"
    };

    renderer.addClassBreakInfo({
        minValue: 0,
        maxValue: 4.0,
        symbol: {
          type: "point-3d",  // autocasts as new PointSymbol3D()
          symbolLayers: [{
            type: "object",  // autocasts as new ObjectSymbol3DLayer()
            resource: { primitive: "cone" },
            material: { color: [0, 169, 230] },
            height: 200000,
            width: 50000
          }]
        }
      });

      
    const myLayer = new FeatureLayer({
        // URL to the service
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/world_cities/FeatureServer/0",
        definitionExpression: "",
        popupTemplate: 
        {
            title: "{CITY_NAME}",
            content: "<ul><li>Population: {POP}</li>" +
                        "<li>Status: {STATUS}</li>" +
                        "<li>Country: {CNTRY_NAME}</li><ul>"
        },
        renderer: myRenderer
        });

    var myMap = new Map({
        basemap : 'streets',
        layers: [myLayer]
    });
    
    var webmap = new WebMap({
        portalItem: { // autocasts as new PortalItem()
          id: "13c2999a1f6c45998f7640fba71776ab"
        }
      });

    var view = new MapView({
        map: myMap,
        container: 'map'
    });

    view.on("layerview-create" , function(e){
        myLayer.queryExtent().then(function(results){
            view.goTo(results.extent);
          });
    })
    
    view.on('click', function(e){
        view.goTo(
        {
            target: e.mapPoint,
            zoom: 5
        }, 
        {
             duration: 2000  
        });
    });

    var basemapGallery = new BasemapGallery({
        view: view
      });

    // view.ui.add(basemapGallery, {
    // position: "top-right"
    // });
    

    var cntryselect = document.querySelector("#cntryselect");
    var cityselect = document.querySelector("#cityselect");

    var reqURL = "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/world_cities/FeatureServer/0/query";
    var reqOpt = {
        responseType : "json",
        query : {
            where: "1=1",
            outFields: ["CITY_NAME", "CNTRY_NAME", "POP"],
            f: "json"
        }
    };
    var currentCntry;

    esriRequest(reqURL, reqOpt).then(function(res){
        console.log(res)
        var cntryArr =[];
        for (let i = 0; i < res.data.features.length; i++) {
            
            if(!cntryArr.includes(res.data.features[i].attributes.CNTRY_NAME)){
                cntryArr.push(res.data.features[i].attributes.CNTRY_NAME);
                var opt = document.createElement("option");
                opt.value = res.data.features[i].attributes.CNTRY_NAME;
                opt.textContent = res.data.features[i].attributes.CNTRY_NAME;
                cntryselect.appendChild(opt);
            }
            
        }

        cntryselect.addEventListener("change", function(){
            if(this.value == "All Countries"){
                myLayer.definitionExpression = "";
                myLayer.queryExtent().then(function(results){
                view.goTo(results.extent, 
                    {
                         duration: 2000  
                    });
              });

            }
            else{
                myLayer.definitionExpression = `CNTRY_NAME = '${this.value}'`;
                reqOpt.query.where = `CNTRY_NAME = '${this.value}'`
                myLayer.queryExtent().then(function(results){
                view.goTo(results.extent, 
                    {
                         duration: 2000  
                    });
              });

              esriRequest(reqURL, reqOpt).then(function(res){
                console.log(reqOpt.query.where)
                if(cityselect.firstChild){
                    cityselect.innerHTML = ''
                }
                
                for (let i = 0; i < res.data.features.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = res.data.features[i].attributes.CITY_NAME;
                    opt.textContent = res.data.features[i].attributes.CITY_NAME;
                    cityselect.appendChild(opt);
                }
        
            });
            }
        })

        
    });



    
    
 });
