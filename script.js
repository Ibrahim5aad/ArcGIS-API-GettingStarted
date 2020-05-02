google.charts.load('current', {packages: ['corechart']});

require(["esri/Map", "esri/views/MapView", "esri/widgets/BasemapGallery",
         "esri/WebMap", "esri/layers/FeatureLayer", "esri/renderers/ClassBreaksRenderer", "esri/request", "esri/layers/GraphicsLayer",
        "esri/Graphic", "esri/widgets/Legend"], 
        function(Map, MapView, BasemapGallery, WebMap, FeatureLayer, Renderer, esriRequest, GraphicsLayer, Graphic, Legend) {


    var myRenderer = {
        type: "class-breaks",
        field: "POP",
        legendOptions: {
            title: "Population"
          },
        classBreakInfos: [
            {
              minValue: -1000000,  
              maxValue: 1000000,  
              symbol: {
                type: "simple-marker", 
                style: "circle",
                color: "blue",
                size: "8px",  
                outline: {
                  color: [ 255, 255, 0 ],
                  width: 1  
                }},  
              label: "fewer than 1,000,000"
            }, {
              minValue: 1000001, 
              maxValue: 2000000, 
              symbol:  {
                type: "simple-marker", 
                style: "circle",
                color: "red",
                size: "8px",  
                outline: {
                  color: [ 0, 255, 255 ],
                  width: 1  
                }},    
              label: "1,000,000 - 2,000,000"
            }, {
              minValue: 2000001,  
              maxValue: 10000000,
              symbol:  {
                type: "simple-marker", 
                style: "circle",
                color: "yellow",
                size: "8px",  
                outline: {
                  color: [ 255, 0, 255 ],
                  width: 1
                }}, 
              label: "more than 2,000,000"
            }
          ],
          defaultSympol:{
            type: "simple-marker", 
            style: "circle",
            color: "yellow",
            size: "8px",  
            outline: {
              color: [ 255, 0, 255 ],
              width: 1
            }}
    };

    var myGraphicLayer = new GraphicsLayer();
      
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
        layers: [myLayer, myGraphicLayer]
    });
    
    var webmap = new WebMap({
        portalItem: { 
          id: "13c2999a1f6c45998f7640fba71776ab"
        }
      });

    var view = new MapView({
        map: myMap,
        container: 'map',
        zoom:2
    });

    var legend = new Legend({
        view: view,
        layerInfos: [{
          layer: myLayer,
          title: ""
        }],
        style: {
            type: "classic",
            layout: "stack"
          }
      });
      
      
    view.ui.add(legend, "bottom-right");

    view.on("layerview-create" , function(e){
        myLayer.queryExtent().then(function(results){
            view.goTo(results.extent);
          });
    })
    

    view.on('click', function(e){
        view.goTo(
        {
            target: e.mapPoint,
            zoom: 4
        }, 
        {
             duration: 2000  
        });
    });

    // var basemapGallery = new BasemapGallery({
    //     view: view
    //   });

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


    esriRequest(reqURL, reqOpt).then(function(res){
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
                if(cityselect.firstChild){
                    cityselect.innerHTML = ''
                }
                var opt1 = document.createElement("option");
                opt1.value = 'All Cities';
                opt1.textContent = 'All Cities';
                cityselect.appendChild(opt1)
                for (let i = 0; i < res.data.features.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = res.data.features[i].attributes.CITY_NAME;
                    opt.textContent = res.data.features[i].attributes.CITY_NAME;
                    cityselect.appendChild(opt);
                }
                
                drawChart(res.data.features);
            });
            }
        });

        cityselect.addEventListener("change", function(){
            if(this.value == 'All Cities'){
                myLayer.definitionExpression = `CNTRY_NAME = '${cntryselect.value}'`;
                myLayer.queryExtent().then(function(results){
                    view.goTo(results.extent, 
                        {
                             duration: 2000  
                        });
                  });
                  myGraphicLayer.removeAll();
            }
            else{
                myLayer.definitionExpression = `CITY_NAME = '${this.value}'`;
                myLayer.queryExtent().then(function(result){
                var point = {
                    type: 'point',
                    longitude: result.extent.center.longitude,
                    latitude: result.extent.center.latitude
                }
                var city = new Graphic({
                    geometry: point,
                    symbol: {
                        type: 'simple-marker',
                        style: 'circle',
                        size: 15
                    }
                });
                myGraphicLayer.removeAll();
                myGraphicLayer.add(city);
                var canvas = document.querySelector('#map > div > div > canvas');
                debugger
                var ctx = canvas.getContext("2d");
                debugger

                ctx.beginPath();
                ctx.arc(95, 50, 40, 0, 2 * Math.PI);
                ctx.stroke();
                
            });
            }
        });


        function drawChart(mydata) {
            console.log(mydata)
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'City');
            data.addColumn('number', 'Population');
            mydata.forEach(feature => {
                data.addRows([
                    [feature.attributes.CITY_NAME, Math.abs(feature.attributes.POP)]
                ]);
                
            });
            var options = {
            title: "Density of Precious Metals, in g/cm^3",
            bar: {groupWidth: "95%"},
            legend: { position: "none" },
            };

            // Instantiate and draw the chart.
            var chart = new google.visualization.BarChart(document.getElementById('mychart'));
            chart.draw(data, options);
          }
        
    });
    
 });
