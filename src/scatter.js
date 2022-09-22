//绘制质量-年份分布图
//流程可参考 distribution.js 的 draw_timeaxis 函数
function drawScatter(mdata){
    var data = d3.filter(mdata, function(d){return d['mass (g)']>1000 && d.year>0});

    const width = page_width * 0.6, height = page_height * 0.8;
    const padding = {top: 20, right: 150, bottom: 70, left: 20};
    const svg = d3.select('#scatter')
        .attr('width', width)
        .attr('height', height);

    const xScale = d3.scaleLinear()
        .domain([1500,2020])
        .range([padding.left, width - padding.right]);

    const yScale = d3.scaleLog()
        .domain([1e3,1e8])
        .range([height - padding.bottom, padding.top]);

    const rScale = d3.scaleSqrt()
        .domain([1,1e8])
        .range([1,10]);

    const color = d3.schemeTableau10;

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format("d"));
    const yAxis = d3.axisRight(yScale)
        .tickFormat(d3.format(",.0s"))
        .tickValues([1e3, 1e4, 1e5, 1e6, 1e7, 1e8]);

    var scatter = svg.append('g')
        .attr('transform', `translate(${padding.left}, ${padding.top})`);

    scatter.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d['mass (g)']))
        .attr('r', d => rScale(d['mass (g)']))
        .attr('fill', d=>{return color[color_map[d.type]]})
        .attr('stroke', 'rgba(0,0,0,0)')
        .attr('stroke-width', 0.5)
        .style('transition', 'all 0.2s ease-in-out')
        //配置鼠标悬停事件
        .on('mouseover', function(event, d){
            d3.select(this).attr('r', (d)=>{return rScale(d['mass (g)'])+5});
            d3.select(this).attr('stroke', 'rgba(255, 255, 255, 0.5)').attr('stroke-width', '5');
        })
        .on('mouseout', function(){
            d3.select(this).attr('r', (d)=>{return rScale(d['mass (g)'])});
            d3.select(this).attr('stroke', 'rgba(0, 0, 0, 0)').attr('stroke-width', '2');
        })
        //为落点添加标注
        .append('title')
        .text((d)=>{return `名称:${d.name}\n类型:${type_cn[d.type]} ${d.recclass}\n质量:${d3.format(',d')(d['mass (g)'])}g\n${d.fall==="Fell"?'坠落':'发现'}时间:${d.year}\n`});

    scatter.append('g')
        .attr('transform', `translate(0, ${height - padding.bottom})`)
        .call(xAxis);

    scatter.append('g')
        .attr('transform', `translate(${width-padding.right}, 0)`)
        .call(yAxis);

    //axis label
    scatter.append('text')
        .attr('x', (width - padding.left - padding.right)/2)
        .attr('y', height-padding.bottom/2 + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .text('发现年份');

    scatter.append('text')
        .attr('transform', `translate(${(width-70)}, ${height/2}) rotate(-90)`)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .text('质量/g');


}