<template>
    <div class="graphHolder" id="graphHolder"></div>
        <!-- Call graph will be generated on mount, which happens when the tab is clicked -->

</template>
<script>
import dagreD3 from "dagre-d3"
import * as d3 from "d3"
import $ from 'jquery' 
export default {
  name: 'CallGraph',
  props:{
      
  },
  data(){
      return{
          graph : []
      }
  },
  mounted() {
        this.createGraph(); //create graph on mount
        console.log("IN")
  },
  methods: {
    createGraph() {
        if(this.graph.length != 0){
            return;
        }
        let a = this.$store.state.displayUnits;
        // get all lines of assembly
        //dictionary with key of memory address in int, and assembly code as value
        let dictData = {};
        //indexes visited already
        let visitedIndexes = new Set();
        //ordered list of the memory address keys
        let dictKeysArray = [];
        //sorted list of boundaries of functions
        let sortedBoundaries = [];
        //dictionary of fucn boundaries, key is start of function, value is end of function
        let funcBoundaries = {};
        //call graph
        let g = new dagreD3.graphlib.Graph().setGraph({});
        
        for(let i = 0; i < a.length; i++){ //loop thru all assembly
            if(!a[i]['isCode']){
                continue; //check if line of assembly is code
            }
             //put current line of assembly in dict, with key of mem address, value of assembly text
            dictData[a[i]['vma']] = a[i]['instStr'];
            //Sets value to be the assembly code
            dictKeysArray.push(a[i]['vma']);
        }
        //for loop to find all subroutine starts
        for(let i in dictData){
            if(dictData[i].includes("call") && dictData[i].slice(5,7) == "0x"){ //check for direct call
                //puts address of call in sortedBoundaries
                sortedBoundaries.push(Number.parseInt(String(dictData[i].split(" ")[1]), 16));
            }
        }

        //sort subroutine starts
        sortedBoundaries.sort();

        let prev = 0;
        //for loop to make a dictionary of subroutine starts and ends
        for(let i = 0; i < sortedBoundaries.length; i++){
            funcBoundaries[prev] = sortedBoundaries[i];
            funcBoundaries[sortedBoundaries[i]] = Number.MAX_VALUE; //last end will be Max_value
            prev = sortedBoundaries[i];
        }

        //takes in index of called function for dictKeysArray, returns id of generated Node
        function createRecur(index){ 
            let id = dictKeysArray[index]; //current lineID
            //find the function boundary in boundaries dict
            let loopToo = funcBoundaries[id] ? funcBoundaries[id] : funcBoundaries[0]; 
            let nodeText = id+"\n" //text to add to current Node
            g.setNode(
                id, {label: nodeText} //update current node with id
            );
            let idNext = dictKeysArray[index]; //var to use to loop thru ids, without mutating id
            while(dictData[idNext] && idNext < loopToo){ //while there are still nodes to check, keep looping
                if(dictData[idNext].includes("call") && dictData[idNext].slice(5,7) == "0x"){ //check if there is a call
                    nodeText+=dictData[idNext]+"\n"; //add the call to the text
                    // find index of called function
                    let jumpToIndex = dictKeysArray.findIndex(element => element == Number.parseInt(String(dictData[idNext].split(" ")[1]), 16));
                    //id of node that will be generated
                    let newNodeID = dictKeysArray[jumpToIndex];
                    
                    //check if we have generated it already before
                    if(!visitedIndexes.has(jumpToIndex)){
                        visitedIndexes.add(jumpToIndex);
                        newNodeID = createRecur(jumpToIndex);
                    }  //recursively call createRecur to create the new node
                    g.setEdge(id, newNodeID, {}); //connect current node with new node created
                }

                index++; //increment index
                idNext = dictKeysArray[index];   //update id
            }
            g.setNode(
                id, {label: nodeText} //update current node text
            )
            return id; //return id so that previous call can make a connection
        }

        //loop through all functions, and generate nodes for them
        for(let i = 0; i < sortedBoundaries.length; i++){
            let nodeText = sortedBoundaries[i] + '\n'; //add node text
            //start index
            let startIndex = dictKeysArray.findIndex(element => element == sortedBoundaries[i]);
            //where function ends
            let endIndex = dictKeysArray.findIndex(element => element == funcBoundaries[sortedBoundaries[i]]);
            if(visitedIndexes.has(startIndex)){
                //if we have already visited this in recursion, no need to do it again, continue
                continue;
            }
            visitedIndexes.add(startIndex);
            //generate the node
            g.setNode(
                sortedBoundaries[i], {label: nodeText}
            )
            
            //loop through the function to get calls inside of it
            for(let j = startIndex; j < endIndex; j++){
                //check and see if there is another call
                let assemblyText = dictData[dictKeysArray[j]];
                if(assemblyText.includes("call") && assemblyText.slice(5,7) == "0x"){
                    nodeText+=assemblyText + "\n";
                    //add text to node, and find index of called function
                    let calledIndex = dictKeysArray.findIndex(element => element == Number.parseInt(String(assemblyText.split(" ")[1]), 16));
                    let newNodeID = dictKeysArray[calledIndex];
                    //check if function node has been generated already, if not, generate it recursively
                    if(!visitedIndexes.has(calledIndex)){
                        visitedIndexes.add(calledIndex);
                        newNodeID = createRecur(calledIndex);
                    }
                    //connect called node to current node
                    g.setEdge(sortedBoundaries[i], newNodeID, {});
                }
            }
            //update node text
            g.setNode(
                sortedBoundaries[i], {label: nodeText}
            )
        }

        console.log("READY TO RENDER")
        //css here needs help.
        const rect = document.getElementById("graphHolder").getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        console.log(width, height);

        //make this height+width the size of the inset of the div
        const svg = d3
            .select("#graphHolder")
            .append('svg')
            .attr("viewBox", [0, 0, width, height])
            .attr("overflow-y", "hidden")
            .attr("overflow-x", "hidden");
        const g1 = svg.append("g");
        console.log(svg)
        svg.call(d3.zoom()
            .extent([[0, 0], [width, height]]) 
            .scaleExtent([0.2, 8])  //scale limits
            .on("zoom", function () {
                g1.attr("transform", d3.zoomTransform(this))
            }))


        // function zoomed({transform}) {
        //     g1.attr("transform", transform);
        // }
        var render = new dagreD3.render();
        render(g1, g);

        // this.graph.push(svg);
        // this.graph.push(g1);
        // this.graph.push(g);
    },
  }
}
</script>
<style>
    text {
        font-weight: 300;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serf;
        font-size: 14px;
    }
    .nodeGraph{
        z-index:-1;
        margin-left:0px;
        height:100%;
        width:100%;
    }
    .node rect {
        stroke: #999;
        fill: #fff;
        stroke-width: 1.5px;
    }

    .edgePath path {
        stroke: #333;
        stroke-width: 1.5px;
    }
    .graphHolder{
        width: 100%;
        height: 100%;
    }
</style>