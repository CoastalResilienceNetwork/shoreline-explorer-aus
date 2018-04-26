define([
	"esri/layers/ArcGISDynamicMapServiceLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/query" ,"esri/tasks/QueryTask", "dojo/_base/declare", "esri/layers/FeatureLayer", 
	"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", "dojo/_base/lang",
	"esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters",
],
function ( 	ArcGISDynamicMapServiceLayer, Extent, SpatialReference, Query, QueryTask, declare, FeatureLayer, 
			SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color, lang,
			IdentifyTask, IdentifyParameters) {
        "use strict";

        return declare(null, {
			esriApiFunctions: function(t){	
				// Add dynamic map service
				t.dynamicLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:1});
				t.map.addLayer(t.dynamicLayer);
				t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
			
				t.dynamicLayer.on("load", function () { 			
					t.layersArray = t.dynamicLayer.layerInfos;
					// Save and Share Handler					
					if (t.obj.stateSet == "yes"){
						//extent
						var extent = new Extent(t.obj.extent.xmin, t.obj.extent.ymin, t.obj.extent.xmax, t.obj.extent.ymax, new SpatialReference({ wkid:4326 }))
						t.map.setExtent(extent, true);
						t.obj.stateSet = "no";
					}
					$("#" + t.id + "prj-sym-wrap input[value='" + t.obj.lyrNum + "']").trigger("click");
					t.clicks.addChosenGroup(t);	
					$("#" + t.id + "prj-info-wrap input[value='" + t.obj.infoGroup + "']").trigger("click");
					var q = "OBJECTID > -1";
					t.clicks.graphicQuery(t,q);	
				});
				//create symbol for graphics
				t.symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,255,0]), 0), new Color([44,123,182,0]));
				t.symbolS = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,255,1]), 2), new Color([44,123,182,0]));
				// query to build objects
				var q = new Query();
				var qt = new QueryTask(t.url + "/0" );
				q.where = "OBJECTID > -1";
				q.returnGeometry = false;
				q.outFields = ["*"];
				var atts = [];
				var type = [];
				var objective = [];
				var strategy = [];
				var town = [];
				qt.execute(q, function(e){
					$.each(e.features, function(i,v){
						atts.push(v.attributes)
						type.push(v.attributes.Primary_Cat)	
						objective.push(v.attributes.Secondary_Cat)
						strategy.push(v.attributes.Action_)
						town.push(v.attributes.Town)
					})
					t.Primary_Cat = _.uniq(type, false).sort();
					t.Secondary_Cat = _.uniq(objective, false).sort();
					t.Action_ = _.uniq(strategy, false).sort();
					t.Town = _.uniq(town, false).sort();
				});
			},
			clearAtts: function(t){
				t.map.graphics.clear();
			} 				
		});
    }
);