//获取陨石分类数据
function filterclass(mdata){
    //陨石数量总和
    var total_meteorite = mdata.length;
    //陨石重量总和
    var total_mass = d3.sum(mdata, (d)=>{return d['mass (g)']})
    //初始化各类陨石列表
    var iron_meteorite, palla_meteorite, stone_meteorite, achondrite_meteorite, chondrite_meteorite;

    //按类型分类
    iron_meteorite = mdata.filter(function(m){
        return m.type === 'Iron';
    });

    palla_meteorite = mdata.filter(function(m){
        return m.type === 'Pallasite';
    });

    stone_meteorite = mdata.filter(function(m){
        return m.type === 'Chondrite' || m.type === 'Achondrite';
    });

    achondrite_meteorite = stone_meteorite.filter(function(m){
        return m.type === 'Achondrite';
    });

    chondrite_meteorite = stone_meteorite.filter(function(m){
        return m.type === 'Chondrite';
    });


    function get_Mass(l){
        return d3.sum(l, (d)=>{
            return d['mass (g)'];
        })
    }

    //设置弧半径：内半径、中层半径、外半径
    const innerRadius =  0.1*page_height, middleRadius = 0.15*page_height,  outerRadius = 0.2*page_height;

    //配置三种弧生成器，分别为外圈，内圈及跨内外圈
    var arc_out = d3.arc()
        .innerRadius(middleRadius)
        .outerRadius(outerRadius)
        .cornerRadius(0)
    
    var arc_in = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(middleRadius)
        .cornerRadius(0);

    var arc_crossed = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(0);

    //返回分类数据
    return [
        {type: 'Iron', value: iron_meteorite.length, mass: get_Mass(iron_meteorite), arc:arc_crossed, text:"铁陨石", percentage: (iron_meteorite.length/total_meteorite*100).toFixed(2), mass_percentage: (get_Mass(iron_meteorite)/total_mass*100).toFixed(2)},
        {type: 'Pallasite', value: palla_meteorite.length, mass: get_Mass(palla_meteorite), arc:arc_crossed, text:"石铁陨石", percentage: (palla_meteorite.length/total_meteorite*100).toFixed(2), mass_percentage: (get_Mass(palla_meteorite)/total_mass*100).toFixed(2)},
        {type: 'Stone', value: stone_meteorite.length, mass: get_Mass(stone_meteorite), arc:arc_in, text:"石陨石", percentage: (stone_meteorite.length/total_meteorite*100).toFixed(2), mass_percentage: (get_Mass(stone_meteorite)/total_mass*100).toFixed(2),
         subtype:[
            {type: 'Achondrite', value: achondrite_meteorite.length, mass: get_Mass(achondrite_meteorite), arc:arc_out, text:"无球粒陨石", percentage: (achondrite_meteorite.length/total_meteorite*100).toFixed(2), mass_percentage: (get_Mass(achondrite_meteorite)/total_mass*100).toFixed(2)},
            {type: 'Chondrite', value: chondrite_meteorite.length, mass: get_Mass(chondrite_meteorite), arc:arc_out, text:"球粒陨石", percentage: (chondrite_meteorite.length/total_meteorite*100).toFixed(2), mass_percentage: (get_Mass(chondrite_meteorite)/total_mass*100).toFixed(2)}
        ]},
    ];
}

//使用filter字段绘制饼图
function draw_class_pie(cdata, filter="value"){
    //配置高宽
    const width = page_height * 0.5, height = page_height * 0.5;
    //配置颜色
    var color = d3.scaleOrdinal(d3.schemeTableau10);
    //配置饼图样式
    var pieLayout = d3.pie()
        .value(function(d){
            return d[filter];
        })
        .sort(null);

    //配置绘制区域
    var svg = d3.select('#classify #'+filter)
        .attr('width', width)
        .attr('height', height)


    //绘制内圈
    var arcs = svg.append("g").attr('id', 'pie_1')
        .selectAll("g")
        .data(pieLayout(cdata))    // 绑定转换后的饼图布局数据
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", `translate(${width/2},${height/2})`);
    
    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);  // 根据颜色映射表来得到填充颜色 
        })
        .attr("d", (d)=>{
            return d.data.arc(d);
        })
        .attr('class', (d)=>{
            return 'arc_' + d.data.type;
        })
        //添加鼠标悬停交互
        .on("mouseenter", function(event,d){
            d3.selectAll('.arc_'+d.data.type).attr("transform", `scale(${d.data.type==='Stone'?0.9:1.1})`);
            parseText('mass', d.data); parseText('value', d.data);
            d3.select('#intro_'+d.data.type).style('display', 'flex');
            d3.select('#intro_default').style('display', 'none');
        })
        .on("mouseleave", function(event,d){
            d3.selectAll('.arc_'+d.data.type).attr("transform", ``);
            parseText('mass'); parseText('value');
            d3.selectAll('#classify .intro').style('display', 'none');
            d3.select('#intro_default').style('display', 'flex');
        })
        .style("transition", "all 1s");

    //初始化外圈数据
    var outerData = [];
    cdata.forEach((d)=>{
        if(!d.subtype){
            outerData.push(d);
        }else{
            d.subtype.forEach((s)=>{
                outerData.push(s);
            })
        }
    });
    //绘制外圈
    var arcs_2 = svg.append("g").attr('id', 'pie_2')
        .selectAll("g")
        .data(pieLayout(outerData))    // 绑定转换后的饼图布局数据
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", `translate(${width/2},${height/2})`)  // 平移到画布中心

    arcs_2.append("path")
        .attr("fill", function(d, i) {
            if(i>1){i = i + 2};
            return color(i);  // 根据颜色映射表来得到填充颜色 
        })
        .attr("d", (d)=>{
            return d.data.type=='Iron'||d.data.type=='Pallasite' ? null : d.data.arc(d);
        })
        .attr('class', (d)=>{
            return 'arc_' + d.data.type;
        })
        .on("mouseenter", function(event,d){
            d3.selectAll('.arc_'+d.data.type).attr("transform", `scale(${d.data.type==='Stone'?0.9:1.1})`);
            parseText('mass', d.data); parseText('value', d.data);
            d3.select('#intro_'+d.data.type).style('display', 'flex');
            d3.select('#intro_default').style('display', 'none');
        })
        .on("mouseleave", function(event,d){
            d3.selectAll('.arc_'+d.data.type).attr("transform", ``);
            parseText('mass'); parseText('value');
            d3.selectAll('#classify .intro').style('display', 'none');
            d3.select('#intro_default').style('display', 'flex');
        })
        .style("transition", "all 1s");   


        
    // 添加中心文字
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .attr('id', filter+'_text')
        .attr('fill', '#fff')
    
    parseText(filter);
}


//中心文字生成函数
//filter: value/mass
//d: 传入的数据，可以为空
function parseText(filter, d=''){
    var text = '';
    var parseNum = d3.format(",");
    if(d===''){
        if(filter==='value'){
            text = '陨石数量分布';
        }else if(filter==='mass'){
            text = '陨石重量分布';
        }
    }else{
        if(filter==='value'){
            text = `${d.text}\n现存 ${parseNum(d.value)} 颗\n 占陨石总数的 ${d.percentage}%`;
        }else if(filter==='mass'){
            text = `${d.text}\n总质量 ${parseNum(d.mass)} 克\n 占陨石总质量的 ${d.mass_percentage}%`;
        }        
    }
    var textData = text.split('\n');
    var textarea = d3.select(`#${filter}_text`);
    // console.log(textarea);
    textarea.selectAll('*').remove();
    textarea.selectAll('tspan')
        .data(textData)
        .enter()
        .append('tspan')
        .attr('x', 0)
        .attr('dy', '1em')
        .text((data)=>data)
}



// function update_class_pie(cdata, filter="mass"){
//     const width = 500, height = 500;

//     var svg = d3.select('#classify svg');

//     var color = d3.scaleOrdinal(d3.schemeTableau10);

//     var pieLayout = d3.pie()
//         .value(function(d){
//             return d[filter];
//         })
//         .sort(null);
        
//     var arcs = svg.select('#pie_1')
//         .select("g").selectAll("path")
//         .data(pieLayout(cdata))
    
//     arcs.transition()
//         .duration(400)
//         .ease(d3.easeLinear)
//         .attrTween("d", arcTween);

//     var outerData = [];
//     cdata.forEach((d)=>{
//         if(!d.subtype){
//             outerData.push(d);
//         }else{
//             d.subtype.forEach((s)=>{
//                 outerData.push(s);
//             })
//         }
//     });

//     var arcs_2 = svg.select('#pie_2')
//         .select("g").selectAll("path")
//         .data(pieLayout(outerData)) 

//     arcs_2.transition()
//         .duration(400)
//         .ease(d3.easeLinear)
//         .attrTween("d", arcTween);

// }

// function arcTween(a) {
//     console.log(this._current);
//     var i = d3.interpolate(this._current, a);
//     this._current = i(0);
//     return function(t) {
//       return a.data.arc(i(t));
//     };
//   }