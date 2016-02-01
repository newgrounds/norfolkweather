// How about we don't completely pollute the global namespace?
Weather = (function () {
    'use strict';
    
    // require React
    var React = require('react');
    var ReactDOM = require('react-dom');
    var classNames = require('classnames');
    
    // Dark Sky api key
    var api_key = "5a877e38ac58b068d622e34a82db1dc1";
    
    // store cards
    var cards = [];
    
    // flip image
    function flip (obj) {
        $(obj.currentTarget).toggleClass('flippy');
    }
    
    // format date from timestamp
    function formatDate (ts) {
        return new Date(ts * 1000);
    }
    
    /**
     * Return a timestamp with the format "m/d/yy h:MM:ss TT"
     * @type {Date}
     */
    function timeStamp (ts) {
        var now = formatDate(ts);
        
        // Create an array with the current month, day and time
        var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

        // Create an array with the current hour, minute and second
        var time = [now.getHours(), now.getMinutes()];

        // Determine AM or PM suffix based on the hour
        var suffix = (time[0] < 12) ? "AM" : "PM";

        // Convert hour from military time
        time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

        // If hour is 0, set it to 12
        time[0] = time[0] || 12;

        // If seconds and minutes are less than 10, add a zero
        for (var i = 1; i < 3; i++) {
            if (time[i] < 10) {
                time[i] = "0" + time[i];
            }
        }

        // Return the formatted string
        return date.join("/") + " " + time.join(":") + " " + suffix;
    }
    
    // map forecast.io icons to weather icons
    var iconMap = {
        'day-sunny': 'wi-forecast-io-clear-day',
        'night-clear': 'wi-forecast-io-clear-night',
        'rain': 'wi-forecast-io-rain',
        'snow': 'wi-forecast-io-snow',
        'sleet': 'wi-forecast-io-sleet',
        'strong-wind': 'wi-forecast-io-wind',
        'fog': 'wi-forecast-io-fog',
        'cloudy': 'wi-forecast-io-cloudy',
        'partly-cloudy-day': 'wi-forecast-io-partly-cloudy-day',
        'day-cloudy': 'wi-forecast-io-partly-cloudy-day',
        'partly-cloudy-night': 'wi-forecast-io-partly-cloudy-night',
        'night-cloudy': 'wi-forecast-io-partly-cloudy-night',
        'hail': 'wi-forecast-io-hail',
        'thunderstorm': 'wi-forecast-io-thunderstorm',
        'tornado': 'wi-forecast-io-tornado',
        'wind': 'wi-day-windy'
    };
    
    // return weather icon from forecast.io icon name
    function convertIcon (iconName) {
        return "wi " + iconMap[iconName];
    }
    
    /* BEGIN COLOR GEN */
    // generate a random color
    function generateRandomColor () {
        return Math.floor(((Math.random() * 16777215) + 16777215) / 2).toString(16);
    }
    
    function contrastingColor (color) {
        return (luma(color) >= 165) ? '000' : 'fff';
    }
    function luma (color) { // color can be a hx string or an array of RGB values 0-255
        var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
        return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
    }
    function hexToRGBArray (color) {
        if (color.length === 3)
            color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
        else if (color.length !== 6)
            throw('Invalid hex color: ' + color);
        var rgb = [];
        for (var i = 0; i <= 2; i++)
            rgb[i] = parseInt(color.substr(i * 2, 2), 16);
        return rgb;
    }
    /* END COLOR GEN */
    
    /*
    * DOWNLOAD BEGIN-------------------------------------------------
    */
    // get the instagram pics based on the selected filter
    function getInstaPics (tag) {
        // if we ran out of images for this
        if (tagURLs[tag] === null) {
            return;
        }
        return $.ajax({
            dataType: "jsonp",
            url: tagURLs[tag],
            success: function (result) {
                if (result.data !== null) {
                    //console.log(result.pagination);
                    // iterate over the images
                    for (var d = 0; d < result.data.length; d++) {
                        var pic = result.data[d];
                        //console.log(pic);
                        
                        // add unique pic to array based on created_time
                        // this may be combined with other queries
                        pics.pushUniqueOrdered(pic);
                    }
                }
                // store url of next page
                if (result.pagination === undefined || result.pagination.next_url === undefined) {
                    tagURLs[tag] = null;
                } else {
                    tagURLs[tag] = result.pagination.next_url;
                }
            }
        });
    }
    
    // download image & display
    function downloadImage (item) {
        // image url, use the smaller one so we don't eat up memory
        var url = item.images.low_resolution.url;
        // format date
        var date = Insta.formatDate(item.created_time);
        
        // create object to hold downloaded image
        var downImage = new Image();
        
        // create divs
        // source for the flip: http://davidwalsh.name/css-flip
        var $container = $("<div>", {class: "flip-container"});
        $container.click(flip);
        // store image details
        $container.attr("storedInfo", JSON.stringify(item));
        // make the image draggable
        $container.draggable({
            containment: "window",
            cursorAt: { top: 50, left: 50 },
            helper: dragHelper
        });
        
        // check if this is one of our favorites
        if (favs.has(item.id)) {
            $container.addClass("fav-pic");
        }
        
        var $flipper = $("<div>", {class: "flipper"});
        var $front = $("<div>", {class: "front"});
        var $back = $("<div>", {class: "back"});
        var col = generateRandomColor();
        var textCol = contrastingColor(col);
        $back.css("background-color", '#' + col);
        
        // fill in content for the back
        var $backContent = $("<div>", {class: "pic-info"});
        $backContent.css("color", '#' + textCol);
        // username
        if (item.user) {
            $backContent.append($("<p class='un'>"+item.user.username+"</p><br/>"));
        }
        // location
        if (item.location) {
            $backContent.append($("<p class='loc'>"+item.location.name+"</p><br/>"));
        }
        $backContent.append($("<p class='date'>"+date+"</p><br/>"));
        // caption
        if (item.caption) {
            $backContent.append($("<p class='caption'>"+item.caption.text+"</p>"));
        }
        
        // nest divs
        $front.append(downImage);
        $back.append($backContent);
        $flipper.append($front);
        $flipper.append($back);
        $container.append($flipper);
        
        // append the image
        $("#temp-holder").append($container);
        
        // show the images once they've all loaded
        downImage.onload = function () {
            numLoaded++;
            
            // sort and display images once they're all loaded
            if (numLoaded >= pics.length) {
                // sort the images in temp-holder & move them to image-holder
                $("#temp-holder").children().sort(function (a, b) {
                    return JSON.parse($(b).attr("storedInfo")).created_time - JSON.parse($(a).attr("storedInfo")).created_time;
                }).appendTo("#image-holder");
                
                // hide loading spinner
                $(".spinner").css({'opacity': 0});
                
                // animate the children... there's something weird about this comment
                // ... especially around halloween
                $.each($("#image-holder").children(), function (index, value) {
                    $(value).addClass("animated fadeIn");
                    // we can do multiple animations this way
                    //$(value).find(".front").addClass("animated pulse");
                    //.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
                    //transition: height 0.3s ease, width 0.3s ease;
                });
                
                // I believe we can clear pics here, maybe to save memory
                //pics = [];
            }
        };
        // set source of image object
        downImage.src = url;
    }
    /*
    * DOWNLOAD END---------------------------------------------------
    */
    
    // retrieve forecast for given location
    function retrieveForecast(loc) {
        return $.ajax({
            dataType: "jsonp",
            url: "https://api.forecast.io/forecast/"+api_key+"/36.9167,-76.2?extend=hourly"
        });
    }
    
    // create cards for each day in the forecast
    function createCards (forecast) {
        // get all the daily forecasts
        var days = forecast.daily.data;
        var hours = forecast.hourly.data;
        
        var Front = React.createClass({
            render: function () {
                var precip;
                if (this.props.day.precipType !== null) {
                    precip = this.props.day.precipType + " " + this.props.day.precipProbability;
                } else {
                    precip = "Precipitation " + this.props.day.precipProbability;
                }
                
                return (
                    <div className="front">
                        <p>{timeStamp(this.props.day.time)}</p>
                        <p>{this.props.day.summary}</p>
                        <p><i className={convertIcon(this.props.day.icon)}></i></p>
                        <p>{this.props.day.temperatureMax} at {timeStamp(this.props.day.temperatureMaxTime)}</p>
                        <p>{this.props.day.temperatureMin} at {timeStamp(this.props.day.temperatureMinTime)}</p>
                        <p>{precip}</p>
                    </div>
                );
            }
        });
        
        var Hour = React.createClass({
            render: function () {
                var precip;
                if (this.props.hour.precipType !== null) {
                    precip = this.props.hour.precipType + " " + this.props.hour.precipProbability;
                } else {
                    precip = "Precipitation " + this.props.hour.precipProbability;
                }
                
                return (
                    <div>
                        <p>{timeStamp(this.props.hour.time)}</p>
                        <p>{this.props.hour.summary}</p>
                        <p>{this.props.hour.icon}</p>
                        <p>{this.props.hour.temperature}</p>
                        <p>Feels like {this.props.hour.apparentTemperature}</p>
                        <p>{precip}</p>
                    </div>
                );
            }
        });
        
        var Back = React.createClass({
            render: function () {
                // generate colors for the background & text
                var col = generateRandomColor();
                var textCol = contrastingColor(col);
                
                var backStyle = {
                    'backgroundColor': '#' + col
                };
                
                var detailsStyle = {
                    color: '#' + textCol
                };
                
                // hours for this day
                var rows = [];
                this.props.hours.forEach(function (hour) {
                    rows.push(<Hour hour={hour} key={hour.time} />);
                });
                
                return (
                    <div className="back" style={backStyle}>
                        <div className="details" style={detailsStyle}>
                            {rows}
                        </div>
                    </div>
                );
            }
        });

        var Flipper = React.createClass({
            getInitialState: function () {
                return {
                    isFlipped: false
                }
            },
            handleClick: function () {
                this.setState({
                    isFlipped: !this.state.isFlipped
                });
            },
            render: function () {
                var flipClass = classNames({
                    'flip-container': true,
                    'flippy': this.state.isFlipped
                });
                
                return (
                    <div
                        className={flipClass}
                        onClick={this.handleClick}>
                        <div className="flipper">
                            <Front day={this.props.day} />
                            <Back hours={this.props.hours} />
                        </div>
                    </div>
                );
            }
        });

        var WeatherCards = React.createClass({
            render: function () {
                // create dictionary of days to hours for each day
                var hourList = {};
                // determine which hours belong to each day
                this.props.hours.forEach(function (hour) {
                    // build dictionary of days to hours
                    var hourDate = formatDate(hour.time).getDay();
                    if (hourList[hourDate] !== undefined) {
                        hourList[hourDate].push(hour);
                    } else {
                        hourList[hourDate] = [hour];
                    }
                });
                
                // build days
                var rows = [];
                this.props.days.forEach(function (day) {
                    var dayDate = formatDate(day.time).getDay();
                    rows.push(<Flipper day={day} hours={hourList[dayDate]} key={day.time} />);
                });
                return (
                    <div>
                        {rows}
                    </div>
                );
            }
        });
         
        ReactDOM.render(
            <WeatherCards days={days} hours={hours} />,
            document.getElementById('container')
        );
    }
    
    // setup the page
    function setup () {
        // show loading spinner
        //$(".spinner").css({'opacity': 1});
        
        retrieveForecast().then(
            function (res) {
                console.log(res);
                createCards(res);
            },
            function (fail) {
                console.log(fail);
            }
        );
    }
    
    // return things that need to be accessible in the HTML
    return {
        flip: flip,
        formatDate: formatDate,
        setup: setup
    };
})();
