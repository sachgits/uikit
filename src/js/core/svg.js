import $ from 'jquery';
import {isVoidElement, toJQuery} from '../util/index';

var storage = window.sessionStorage || {}, svgs = {};

export default function (UIkit) {

    UIkit.component('svg', {

        props: {
            id: String,
            icon: String,
            src: String,
            class: String,
            style: String,
            width: Number,
            height: Number,
            ratio: Number
        },

        defaults: {
            ratio: 1,
            id: false,
            class: '',
            exclude: ['src']
        },

        ready() {

            this.src = getComputedStyle(this.$el[0], '::before')['background-image'].slice(4, -1).replace(/"/g, '') || this.src;

            if (this.src.indexOf('#') !== -1) {

                var parts = this.src.split('#');

                if (parts.length > 1) {
                    this.src = parts[0];
                    this.icon = parts[1];
                }
            }

            this.svg = this.get(this.src).then(doc => {

                var svg = toJQuery($(doc).filter('svg')), el;

                el = !this.icon ? svg : (el = toJQuery(`#${this.icon}`, svg))
                && $($('<div>').append(el).html().replace(/symbol/g, 'svg')) // IE workaround, el[0].outerHTML
                || !toJQuery('symbol', svg) && svg; // fallback if SVG has no symbols

                if (!el) {
                    return $.Deferred().reject('SVG not found.');
                }

                var dimensions = el[0].getAttribute('viewBox'); // jQuery workaround, el.attr('viewBox')

                if (dimensions) {
                    dimensions = dimensions.split(' ');
                    this.width = this.width || dimensions[2];
                    this.height = this.height || dimensions[3];
                }

                this.width *= this.ratio;
                this.height *= this.ratio;

                for (var prop in this.$options.props) {
                    if (this[prop] && this.exclude.indexOf(prop) === -1) {
                        el.attr(prop, this[prop]);
                    }
                }

                if (!this.id) {
                    el.removeAttr('id');
                }

                if (this.width && !this.height) {
                    el.removeAttr('height');
                }

                if (this.height && !this.width) {
                    el.removeAttr('width');
                }

                if (isVoidElement(this.$el)) {
                    this.$el.attr({hidden: true, id: null});
                    return el.insertAfter(this.$el);
                } else {
                    return el.appendTo(this.$el);
                }

            });

        },

        destroy() {

            if (isVoidElement(this.$el)) {
                this.$el.attr({hidden: null, id: this.id || null});
            }

            if (this.svg) {
                this.svg.then(svg => svg.remove());
            }
        },

        methods: {

            get(src) {

                if (svgs[src]) {
                    return svgs[src];
                }

                var key = `uikit_${UIkit.version}_${src}`;
                svgs[src] = $.Deferred();

                if (!storage[key]) {
                    $.get(src).then((doc, status, res) => {
                        storage[key] = res.responseText;
                        svgs[src].resolve(storage[key]);
                    });
                } else {
                    svgs[src].resolve(storage[key]);
                }

                return svgs[src];
            }

        }

    });

}