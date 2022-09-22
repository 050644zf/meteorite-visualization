//筛选年份
function filteryear(mdata){
    mdata = mdata.filter((d)=>{return d.year})
    mdata = d3.sort(mdata, (d)=>{return d.year});
    var ydata = d3.group(mdata, (d)=>{return d.year});
    return ydata;
}

//地图绘制函数
function drawMap(data){
    //配置高宽
    const width = 0.7 * page_width, height = 0.6 * page_height;
    //配置原始地图尺寸
    const map_size = {
        width: 1000,
        height: 420
    };

    //由于太多数据会导致浏览器卡顿，我们对数据进行了清洗和筛选，去除无坐标、无质量、无年份且质量小于1千克的陨石数据
    var mdata = data.filter((d)=>{
        if(!d.reclat|| d.reclat == 0.000000 || d.reclat <-70 || d.reclat > 70 || !d['mass (g)'] || d['mass (g)'] < 1000|| d['mass (g)'] == undefined|| !d.year){
            return false;
        }
        return true;
    })
    console.log(mdata.length)
    //配置地图区域
    var svg = d3.select('#map')
        .attr('width', width)
        .attr('height', height)
        .attr('cursor', 'grab'); //配置光标为拖拽

    //绘制边框
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('stroke', 'goldenrod')
        .attr('stroke-width', '1px')
        .attr('fill', 'none');

    //配置地图缩放
    const zoom = d3.zoom()
        .scaleExtent([0.8, 8])
        .translateExtent([[0, 0], [width, height]])
        //缩放操作侦听函数
        //缩放操作开始时，隐藏所有陨石落点，避免卡顿
        .on('start', ()=>{
            svg.select('#landings').attr('visibility', 'hidden');
        })
        //缩放操作进行时，移动地图，光标转化为正在拖拽
        .on('zoom', e=>{
            svg.selectAll('path').attr('transform', (transform = e.transform))
            svg.attr('cursor', 'grabbing');
        })
        //缩放操作结束，移动所有陨石，显示所有陨石落点，光标复原
        .on('end', (e)=>{
            svg.selectAll('circle').attr('transform', (transform = e.transform));
            svg.select('#landings').attr('visibility', 'visible');
            svg.attr('cursor', 'grab');
        });
    
    //应用缩放
    svg.call(zoom);
    svg.transition().duration(750)
        .call(zoom.transform, d3.zoomIdentity);

    //配置地图投影
    var projection = d3.geoEqualEarth();
    
    //配置地图绘制器
    var path = d3.geoPath()
        .projection(projection);
    
    //绘制地图
    svg.selectAll('path')
        .data(worldMap.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke', 'none')
        .attr('stroke-width', 0.5)
        .attr('transform', `scale(${width/map_size.width}) `);

    //配置质量比例尺，使用平方根尺度函数
    var mass_scale = d3.scaleSqrt()
        .domain([0, d3.max(mdata, (d)=>{return d['mass (g)']})])
        .range([0.2, 10]);
    
    //配置颜色
    var color = d3.schemeTableau10;

    var landings = svg.append('g')
        .attr('id', 'landings');
    
    //绘制陨石落点
    landings.selectAll('circle')
        .data(mdata, (d)=>{return d.id})
        .enter()
        .append('circle')
        .attr('class', 'landing')
        .attr('cx', (d)=>{return projection([d.reclong, d.reclat])[0]})
        .attr('cy', (d)=>{return projection([d.reclong, d.reclat])[1]})
        .attr('r', (d)=>{return mass_scale(d['mass (g)'])})
        .attr('fill', (d)=>{return color[color_map[d.type]]})
        .attr('stroke', 'rgba(0, 0, 0, 0)')
        .attr('stroke-width', '2')
        .attr('transform', `scale(${width/map_size.width}) `)
        .style('transition', 'all 0.2s ease-in-out')
        //配置鼠标悬停事件
        .on('mouseover', function(event, d){
            d3.select(this).attr('r', (d)=>{return mass_scale(d['mass (g)'])+5});
            d3.select(this).attr('stroke', 'rgba(255, 255, 255, 0.5)').attr('stroke-width', '5');
        })
        .on('mouseout', function(){
            d3.select(this).attr('r', (d)=>{return mass_scale(d['mass (g)'])});
            d3.select(this).attr('stroke', 'rgba(0, 0, 0, 0)').attr('stroke-width', '2');
        })
        //为落点添加标注
        .append('title')
        .text((d)=>{return `名称:${d.name}\n类型:${type_cn[d.type]} ${d.recclass}\n质量:${d3.format(',d')(d['mass (g)'])}g\n${d.fall==="Fell"?'坠落':'发现'}时间:${d.year}\n`});

    //配置按钮组
    var buttons = d3.select('#distribution .buttons');

    //配置按钮组按钮的侦听函数
    buttons.selectAll('svg')
        .on('mouseover', function(){
            d3.select(this).select('path').attr('fill', 'rgba(255, 255, 255, 0.5)');
        })
        .on('mouseout', function(){
            d3.select(this).select('path').attr('fill', 'rgba(255, 255, 255, 1)');
        })
        .select('path')
        .style('transition', 'all 0.2s ease-in-out')

    //配置各按钮的功能
    d3.select('#play')
        .on('click',()=>{
            if(animation){
                pause_animation();
            }else{
                animate_year(current_year, 5);
            }
        })
        .append('title')
        .text('播放/暂停');


    d3.select('#fastrewind')
        .on('click',()=>{
            pause_animation();
            animate_year(current_year, -10);
        })
        .append('title')
        .text('快退');

    d3.select('#fastforward')
        .on('click',()=>{
            pause_animation();
            animate_year(current_year, 10);
        })
        .append('title')
        .text('快进');

    d3.select('#replay')
        .on('click',()=>{
            pause_animation();
            animate_year(850, 5);
        })
        .append('title')
        .text('重播');

    return projection;
}

//年份尺度函数
var xScale_year, year_list;

//绘制年份折线图
function draw_timeaxis(ydata){
    //配置高宽，填充值
    const width = 0.6 * page_width, height = 0.2 * page_height;
    const padding = {
        top: 30,
        right: 60,
        bottom: 20,
        left: 50
    };
    //配置渐变函数
    const createGradient = select => {
        const gradient = select
          .select('defs')
            .append('linearGradient')
              .attr('id', 'gradient')
              .attr('x1', '0%')
              .attr('y1', '100%')
              .attr('x2', '0%')
              .attr('y2', '0%');

        gradient
          .append('stop')
            .attr('offset', '0%')
            .attr('style', 'stop-color:rgb(0, 198, 248);stop-opacity:0');

        gradient
          .append('stop')
            .attr('offset', '100%')
            .attr('style', 'stop-color:rgb(0, 198, 248);stop-opacity:.5');
    }

    //配置绘制区域
    var svg = d3.select('#timeaxis')
        .attr('width', width)
        .attr('height', height);

    //应用渐变函数
    svg.append('defs');
    svg.call(createGradient);

    //年份范围
    const year_range = d3.extent(ydata.keys());

    //获取年份数据
    year_list = d3.range(year_range[0], year_range[1]+1);
    Array.from(ydata, ([key, value]) => ({key, value})).forEach((d)=>{
        d.value = d.value.length;
        year_list.push(d);
    });

    //获取陨石数量在年份上的累计和
    var cumsum = d3.cumsum(year_list, (d)=>{return d.value});
    cumsum.forEach((d,i)=>{
        year_list[i].cumsum = d;
    });

    console.log(year_list);
    

    console.log(year_range);

    //配置x轴比例尺
    var xScale = d3.scaleLinear()
        .domain([850,2020])
        .range([padding.left, width - padding.right])

    xScale_year = xScale;

    //配置y轴比例尺，使用对数坐标轴
    var yScale = d3.scaleLog()
        .domain([1, d3.max(year_list, (d)=>{return d.cumsum})])
        .range([height - padding.bottom, padding.top])


    //配置x轴
    var xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'))

    //配置y轴
    var yAxis = d3.axisRight(yScale)
        .tickFormat(d3.format(',d'))
        .tickValues([1,10,100,1000,10000,40000]);

    //配置年份线生成器
    var year_line = d3.line()
        .defined(d => !isNaN(d.cumsum))
        .x((d)=>{return xScale(d.key)})
        .y((d)=>{return yScale(d.cumsum)})
    //区域生成器
    var year_area = d3.area()
        .defined(d => !isNaN(d.cumsum))
        .x((d)=>{return xScale(d.key)})
        .y0(height - padding.bottom)
        .y1((d)=>{return yScale(d.cumsum)})

    //绘制坐标轴
    svg.append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(0, ${height - padding.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('id', 'yAxis')
        .attr('transform', `translate(${width - padding.right}, 0)`)
        .call(yAxis);

    //绘制年份线
    d3.selectAll('#xAxis .tick').select('line')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('y1', -height + padding.bottom + padding.top)

    //绘制年份折线图
    svg.append('path')
        .datum(year_list)
        .attr('d', year_line)
        .attr('id', 'year_line')
        .attr('fill', 'none')
        .attr('stroke', 'rgb(0, 198, 248)')
        .attr('stroke-width', 2)

    svg.append('path')
        .datum(year_list)
        .attr('d', year_area)
        .attr('id', 'year_area')
        .attr('fill', 'url(#gradient)')

    //绘制y轴标签
    svg.append('text')
        .attr('fill','#fff')
        .attr('font-size','10px')
        .attr('transform',`rotate(90) translate(${(height-padding.top-padding.bottom)/2},${-width+10})`)
        .text('陨石数量（颗）')

    //绘制年份标签
    var year_indicator = svg.append('g')
        //为年份标签添加拖拽响应函数
        .call(
            d3.drag()
                //拖拽开始时，停止动画，高亮年份标签线段
                .on('start', ()=>{
                    pause_animation();
                    year_indicator.select('line').attr('stroke-opacity', 1).attr('stroke-width', 4);
                })
                //拖拽进行时，更新年份标签的位置，并确保不会超出范围
                .on('drag', (event, d)=>{
                    var x = event.x;
                    if(x < padding.left){x=padding.left}
                    else if(x > width - padding.right){x=width - padding.right}
                    year_indicator.select('line').attr('x1', x).attr('x2', x);
                    var year = Math.floor(xScale.invert(x));
                    year_indicator.select('text').attr('x', x).text(`⣿ ${year} ⣿` );
                })
                //拖拽结束时，恢复年份标签线段，根据年份重新更新地图
                .on('end', (event, d)=>{
                    var x = event.x;
                    if(x < padding.left){x=padding.left}
                    else if(x > width - padding.right){x=width - padding.right}
                    year_indicator.select('line').attr('stroke-opacity', 0.5).attr('stroke-width', 2);
                    var year = Math.floor(xScale.invert(x));
                    year_indicator.select('text').text(`⣿ ${year} ⣿` );
                    current_year = year;
                    updateMapbyYear(meteorite_data, year);
                })
        )

    //绘制年份标签的线段和文本
    year_indicator.append('line')
        .attr('id', 'year_indicator')
        .attr('x1', padding.left)
        .attr('x2', padding.left)
        .attr('y1', padding.top)
        .attr('y2', height - padding.bottom)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5, 5')
        .attr('stroke-opacity', 0.5)
        .style('transition', 'all 0.5s');

    year_indicator.append('text')
        .attr('id', 'year_text')
        .attr('x', padding.left)
        .attr('y', '0')
        .attr('dy', '1em')
        .attr('font-size', '1em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('cursor', 'move')
        .style('transition', 'all 0.5s')
        .text(`⣿${year_range[0]}⣿` )
}

//使用年份year更新地图
function updateMapbyYear(data, year){

    //以下过程大致与 drawMap 函数相同

    var mdata = data.filter((d)=>{
        if(!d.reclat|| d.reclat == 0.000000 || d.reclat <-70 || d.reclat > 70 || !d['mass (g)'] || d['mass (g)'] < 1000|| d['mass (g)'] == undefined||!d.year){
            return false;
        }
        return true;
    })
    var projection = d3.geoEqualEarth();

    var mass_scale = d3.scaleSqrt()
        .domain([0, d3.max(mdata, (d)=>{return d['mass (g)']})])
        .range([0.2, 10]);

    var landings = d3.select('#landings');

    landings.selectAll('circle')
        .data(mdata, (d)=>{return d.id})
        .attr('r', (d)=>{
            var mass = mass_scale(d['mass (g)']);
            if(d.year >= year && d.year < year+10){
                return mass*3>10?mass*1.5:mass*3;
            }else if(d.year < year){
                return mass_scale(d['mass (g)']);
            }
            return 0;
        })

    // console.log(xScale_year(year));

    d3.select('#year_indicator')
        .attr('x1', xScale_year(year))
        .attr('x2', xScale_year(year));

    d3.select('#year_text')
        .attr('x', xScale_year(year))
        .text(`⣿ ${year} ⣿` );
}

//年份动画函数，start为起始年份，step为步进值
function animate_year(start=850,step=10){
    
    if(start){current_year = start;}
    d3.select('#play').select('path').attr('d', pause_icon);
    playing = true;
    animation = setInterval(()=>{
        current_year+=step;
        if(current_year>2013){
            current_year = 2020;
            updateMapbyYear(meteorite_data, current_year);
            pause_animation();
        }
        if(current_year<850){
            current_year = 850;
            updateMapbyYear(meteorite_data, current_year);
            pause_animation();
        }
        updateMapbyYear(meteorite_data, current_year);
    }, 100);
}

//暂停年份动画函数
function pause_animation(){
    d3.select('#play').select('path').attr('d', play_icon);
    clearInterval(animation);
    animation = null;
}