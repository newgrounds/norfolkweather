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
    
    // convert number to percent
    function toPercent(num) {
        return Math.floor(num * 100);
    }
    
    // format date from timestamp
    function formatDate (ts) {
        return new Date(ts * 1000);
    }
    // get day of week from ts
    function getDay (ts) {
        var d = formatDate(ts).getDay();
        switch (d) {
            case 0: return "Sunday";
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
        }
    }
    // convert ts to date and then format
    function timeStampHelper (ts) {
        return timeStamp(formatDate(ts));
    }
    /**
     * Return a timestamp with the format "m/d/yy h:MM:ss TT"
     * @type {Date}
     */
    function timeStamp (now) {
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
        'clear-day': 'wi-forecast-io-clear-day',
        'day-sunny': 'wi-forecast-io-clear-day',
        'clear-night': 'wi-forecast-io-clear-night',
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
        var foundIcon = iconMap[iconName];
        if (foundIcon) {
            return "wi " + iconMap[iconName];
        } else {
            return "wi wi-forecast-io-clear-day";
        }
    }
    
    /*
     * BEGIN cloning
     */
    // cache the clone
    var $clone = $('#cardClone');
    // store clicked card so we can track it
    var $lastelement = "";
    // set up object for last clicked element so we know where to return to on collapse
    var lastelement = {
        'top': 0,
        'left': 0,
        'width': 0,
        'height': 0
    };
    // the current flip state of the clone
    var cloneflipped = false;
    
    // bind handler to the clone to detect when the transition ends
    $('#cardClone').on("transitionend webkitTransitionEnd oTransitionEnd", function (e) {
        if (e.target === e.currentTarget) {
            if (e.originalEvent.propertyName == 'top') {
                // toggle clone state
                cloneflipped = !cloneflipped;
                
                // detect when clone returns to original position, then hide it
                if (!cloneflipped) {
                    $($lastelement).css('opacity', 1);
                    $($clone).hide();
                } else {
                    // dynamically alter contents of the clone rear AFTER it animates here
                    //$('#cloneBack').html('hi');
                }
            }
        }
    });
    
    // tony hawk's pro skater
    // do a sick click flip to trigger the flip when you click
    // went with this approach when I couldn't get it done in React
    // http://stackoverflow.com/questions/24503882/the-google-cards-flip-and-grow-effect
    function clickFlip (obj) {
        if (!cloneflipped) {
            //Cache clicked card
            $lastelement = $(obj);

            // store position of this element for the return trip
            var offset = $lastelement.offset();
            lastelement.top = offset.top - 30 - $(document).scrollTop();
            lastelement.left = offset.left - 30;
            lastelement.width = $lastelement.width();
            lastelement.height = $lastelement.height();

            // check if clicked card is further left or right of the screen
            // we can rotate inwards toward the center
            var rotatefront = "rotateY(180deg)";
            var rotateback = "rotateY(0deg)";
            if ((lastelement.left + lastelement.width / 2) > $(window).width() / 2) {
                rotatefront = "rotateY(-180deg)";
                rotateback = "rotateY(-360deg)";
            }

            // copy clicked card contents onto the clone's front
            $clone.find('#cloneFront').html($lastelement.html());

            // show clone on top of clicked card and hide clicked card
            $clone.css({
                'display': 'block',
                'top': lastelement.top,
                'left': lastelement.left
            });
            $lastelement.css('opacity', 0);

            // dynamically alter contents of the clone rear BEFORE it animates here
            $('#cloneBack').html($lastelement.find(".back").html());

            // flip card while centering it on the screen
            // must wait for clone to finish drawing, so delay it 100ms
            setTimeout(function () {
                $clone.css({
                    'top': '10%',
                    'left': '40px',
                    'height': '75%',
                    'width': $(document).width() - 120 + 'px'
                });
                $clone.find('#cloneFront').css({
                    'transform': rotatefront
                });
                $clone.find('#cloneBack').css({
                    'transform': rotateback
                });
            }, 100);
        } else {
            $('body').click();
        }
    }
    
    // switch from hourly back to daily
    function unflip (e) {
        if (cloneflipped) {
            if (e.target === e.currentTarget) {
                //Reverse the animation
                $clone.css({
                    'top': lastelement.top + 'px',
                    'left': lastelement.left + 'px',
                    'height': lastelement.height + 'px',
                    'width': lastelement.width + 'px'
                });
                $clone.find('#cloneFront').css({
                    'transform': 'rotateY(0deg)'
                });
                $clone.find('#cloneBack').css({
                    'transform': 'rotateY(-180deg)'
                });
            }
        }
    }
    
    // return to default when user clicks outside of card
    $('body').click(unflip);
    $('.head-wrap').click(unflip);
    /*
     * END cloning
     */
    
    // retrieve forecast for given location
    function retrieveForecast(loc) {
        return $.ajax({
            dataType: "jsonp",
            url: "https://api.forecast.io/forecast/"+api_key+"/36.9167,-76.2?extend=hourly"
        });
    }
    
    // setup the page
    function setup () {
        // the front of the card
        var Front = React.createClass({
            render: function () {
                var precip;
                if (this.props.day.precipType) {
                    precip = toPercent(this.props.day.precipProbability) + "% chance of " + this.props.day.precipType;
                } else {
                    precip = toPercent(this.props.day.precipProbability) + "% chance of precipitation";
                }
                
                var dayOfWeek = getDay(this.props.day.time);
                
                return (
                    <div className="front">
                        <div className="date-line">{dayOfWeek}</div>
                        <p>{timeStampHelper(this.props.day.time).split(" ")[0]}</p>
                        <p className="summary">{this.props.day.summary}</p>
                        <div className="icon-line"><i className={convertIcon(this.props.day.icon)}></i></div>
                        <p>High {this.props.day.temperatureMax}&deg; &#64; {timeStampHelper(this.props.day.temperatureMaxTime).split(" ").splice(1).join(" ")}</p>
                        <p>Low {this.props.day.temperatureMin}&deg; &#64; {timeStampHelper(this.props.day.temperatureMinTime).split(" ").splice(1).join(" ")}</p>
                        <p>{precip}</p>
                    </div>
                );
            }
        });
        
        // each hour of the 10 hours per day
        var Hour = React.createClass({
            render: function () {
                var precip;
                if (this.props.hour.precipType) {
                    precip = toPercent(this.props.hour.precipProbability) + "% chance of " + this.props.hour.precipType;
                } else {
                    precip = toPercent(this.props.hour.precipProbability) + "% chance of precipitation";
                }
                
                return (
                    <div className="hour-holder">
                        <p>{timeStampHelper(this.props.hour.time)}</p>
                        <p>{this.props.hour.summary}</p>
                        <p><i className={convertIcon(this.props.hour.icon)}></i></p>
                        <p>{this.props.hour.temperature}&deg;</p>
                        <p>Feels like {this.props.hour.apparentTemperature}&deg;</p>
                        <p>{precip}</p>
                    </div>
                );
            }
        });
        
        // the back of the card
        var Back = React.createClass({
            render: function () {
                var backStyle = {
                    'backgroundColor': '#000'
                };
                
                var detailsStyle = {
                    color: '#ddd'
                };
                
                // hours for this day
                var rows = [];
                if (this.props.hours) {
                    this.props.hours.forEach(function (hour) {
                        rows.push(<Hour hour={hour} key={hour.time} />);
                    });
                }
                
                return (
                    <div className="back" style={backStyle}>
                        <div className="details" style={detailsStyle}>
                            {rows}
                        </div>
                    </div>
                );
            }
        });

        // the part that allows flipping to happen
        var Flipper = React.createClass({
            /*getInitialState: function () {
                return {
                    isFlipped: false
                }
            },*/
            flip: function () {
                /*this.setState({
                    isFlipped: !this.state.isFlipped
                });*/
                var d = $(ReactDOM.findDOMNode(this)).find(".flip-container")[0];
                clickFlip(d);
                this.props.dayClick(this);
            },
            render: function () {
                var stayClass = classNames({
                    'flip-container': true,
                    'animated': true,
                    'fadeInUp': true/*,
                    'flippy': this.state.isFlipped/*,
                    'hidden': this.state.isFlipped*/
                });
                
                return (
                    <div>
                        <div className={stayClass} onClick={this.flip}>
                            <div className="flipper">
                                <Front day={this.props.day} />
                                <Back hours={this.props.hours} />
                            </div>
                        </div>
                    </div>
                );
            }
        });
        
        // keeps track of last updated time
        var Updater = React.createClass({
            render: function () {
                return (
                    <div className="update-time" onClick={unflip}>
                        Last updated {this.props.time}
                    </div>
                );
            }
        });
        
        // tells the data to refresh
        var Refresher = React.createClass({
            render: function () {
                return (
                    <div id="refresher" onClick={this.props.onClick}>
                        <i className="fa fa-refresh"></i>
                    </div>
                );
            }
        });
        
        // reusable clone for flip-container during flip
        /*var Clone = React.createClass({
            getInitialState: function () {
                return {
                    object: null
                };
            },
            componentWillReceiveProps: function () {
                if (this.props.day) {
                    var d = $(ReactDOM.findDOMNode(this.props.day)).find(".flip-container")[0];
                    this.setState({
                        object: d
                    });
                }
            },
            componentDidUpdate: function () {
                var other = this.state.object;
                if (other) {
                    var el = $(ReactDOM.findDOMNode(this)).find(".flip-container")[0];
                    el.offset({
                        top: other.offset.top,
                        left: other.offset.left
                    });
                    el.css({
                        position: absolute
                    });
                }
            },
            render: function () {
                // classes for flip-container clone
                var cloneClass = classNames({
                    'flip-container': true,
                    'clone': true,
                    //'flippy': this.state.isFlipped,
                    //'hidden': !this.state.isFlipped
                });
                
                if (this.props.day) {
                    return (
                        <div className={cloneClass}>
                            <div className="flipper">
                                <Front day={this.props.day.props.day} />
                                <Back hours={this.props.day.props.hours} />
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className={cloneClass}>
                        </div>
                    );
                }
            }
        });*/
        
        // parent component
        var WeatherCards = React.createClass({
            getInitialState: function () {
                return {
                    // show the intro
                    intro: true,
                    // show the hourly view
                    //hourly: false,
                    // days in the forecast
                    days: [],
                    // hours in the forecast
                    hours: [],
                    // last updated time
                    time: "",
                    //chosenDay: null
                }
            },
            getForecast: function () {
                // show loading spinner
                $(".spinner").css({'opacity': 1});
                
                this.setState({
                    intro: false
                });
                
                // asynchronously retrieve the forecast
                retrieveForecast().then(
                    function (forecast) {
                        console.log(forecast);
                        $(".spinner").css({'opacity': 0});
                        this.setState({
                            days: forecast.daily.data,
                            hours: forecast.hourly.data,
                            time: timeStamp(new Date())
                        });
                    }.bind(this),
                    function (fail) {
                        console.log(fail);
                        $(".spinner").css({'opacity': 0});
                        this.setState({
                            intro: true
                        });
                    }.bind(this)
                );
            },
            componentDidMount: function () {
                // reload data every 2 minutes
                window.setInterval(function () {
                    this.getForecast();
                }.bind(this), 120000);
            },
            dayClick: function (clickedDay) {
                /*this.setState({
                    hourly: true
                    //chosenDay: clickedDay
                });*/
            },
            render: function () {
                // create dictionary of days to hours for each day
                var hourList = {};
                // determine which hours belong to each day
                this.state.hours.forEach(function (hour) {
                    // build dictionary of days to hours
                    var hourDate = formatDate(hour.time).getDate();
                    if (hourList[hourDate] !== undefined) {
                        hourList[hourDate].push(hour);
                    } else {
                        hourList[hourDate] = [hour];
                    }
                });
                
                // build days
                var rows = [];
                this.state.days.forEach(function (day) {
                    var dayDate = formatDate(day.time).getDate();
                    rows.push(<Flipper day={day} hours={hourList[dayDate]} dayClick={this.dayClick} key={day.time} />);
                }.bind(this));
                
                // show intro state
                if (this.state.intro) {
                    return (
                        <div className="intro">
                            <div className="start-button" onClick={this.getForecast}>
                                Get the forecast in Norfolk
                            </div>
                        </div>
                    );
                }
                // show forecast state
                else {
                            /*<Clone day={this.state.chosenDay} />*/
                    return (
                        <div>
                            <Refresher onClick={this.getForecast} />
                            {rows}
                            <Updater time={this.state.time} />
                        </div>
                    );
                }
            }
        });
        
        // time to render
        ReactDOM.render(
            <WeatherCards />,
            document.getElementById('container')
        );
    }
    
    // return things that need to be accessible in the HTML
    return {
        setup: setup
    };
})();
