var jQuery;
if (typeof window !== 'undefined' && window.jQuery) {
  jQuery = window.jQuery;
} else if (typeof require !== 'undefined') {
  jQuery = require('jquery');
}

(function($) {


	// Public members
	var plugin = {


		// Plugin namespace
		namespace: 'numberSpinner',


		/**
		 * Initialise
		 * @param options - initialisation options
		 */
		initialise: function(options) {

			// Initialise options
			options = $.extend(true, {}, _defaults, options);

			// Initialise elements
			return this.each(function() {
				var $this = $(this);

				// Check for plugin data, cancel if initialised
				if ($this.data(plugin.namespace)) return true;

				// Initialise data
				var instanceOptions = $.extend(true, {}, options),
				data = {
					options: instanceOptions,
					elements: {}
				};
				$this.data(plugin.namespace, data);

				// Get properties
				if ($this.data('min-digits') !== undefined) {
					data.options.min_digits = $this.data('min-digits');
				}
				if ($this.data('blank-leading-digits') !== undefined) {
					data.options.blank_leading_digits = $this.data('blank-leading-digits');
				}

				// Initialise elements
				_private.initialiseElements.call($this);

			});

		},


		/**
		 * Destroy
		 */
		destroy: function() {
			return this.each(function() {
				var $this = $(this),
				data = $this.data(plugin.namespace);

				// Check for plugin data, cancel if uninitialised
				if (!data) return true;

				// Remove elements and data
				_private.removeElements.call($this),
				$this.removeData(plugin.namespace);

			});
		},


		/**
		 * Set number
		 * @param number - number to set spinner to
		 * @param animate - animate spinner, default: true
		 */
		set: function(number, animate) {
			return this.each(function() {
				var $this = $(this),
				data = $this.data(plugin.namespace);

				// Render number
				_private.renderNumber.call($this, number, (animate !== false));

			});
		}


	},


	// Private members
	_private = {


		/**
		 * Initialise elements
		 */
		initialiseElements: function() {
			return this.each(function() {
				var $this = $(this),
				data = $this.data(plugin.namespace);

				// Get initial value
				var val = parseInt($this.text());

				// Create and add tile wrapper
				data.elements.tile_wrapper = $('<span />', {'class': data.options.tile_wrapper_class}),
				$this.empty().append(data.elements.tile_wrapper);

				// Set initial value
				if (!isNaN(val)) plugin.set.call($this, val, false);

			});
		},


		/**
		 * Remove elements
		 */
		removeElements: function() {
			return this.each(function() {
				var $this = $(this),
				data = $this.data(plugin.namespace);

				// Remove tile wrapper
				data.elements.tile_wrapper.remove();

			});
		},


		/**
		 * Render number
		 * @param number - new number
		 * @param animate - animate spinner, default: true
		 */
		renderNumber: function(number, animate) {
			return this.each(function() {
				var $this = $(this),
				data = $this.data(plugin.namespace);

				// Get spinner length and current width
				var numberLength = number.toString().length;
				var displayLength = Math.max(data.options.min_digits, numberLength),
				from_width = $this.width();

				// Prepend tiles to fill spinner
				while (data.elements.tile_wrapper.find('.' + data.options.tile_class).length < displayLength) {
					var $tile = $('<span />', {'class': data.options.tile_class}),
					$digits = $('<span />', {'class': data.options.digit_wrapper_class}),
					di;
					for (di = 0; di < 11; ++di) {
						$digits.prepend($('<span />', {
							'class': data.options.digit_class,
							'text': (di % 10)
						}));
					}
					$digits.append($('<span />', {  // extra file for blank digits if configured to display spaces instead
						'class': data.options.digit_class,
						'html': '&nbsp;'
					}));
					$tile.append($digits);
					data.elements.tile_wrapper.prepend($tile);
				}

				// Move tiles to position
				var $tiles = data.elements.tile_wrapper.find('.' + data.options.tile_class),
				tile_height = $tiles.find('.' + data.options.digit_class).eq(0).height(), tile_offset = -(tile_height * 10);

				$tiles.each(function(ti, tile) {
					const isEmpty = data.options.blank_leading_digits && numberLength < (displayLength - ti);

					// Get tile, digits wrapper and tile data
					var $tile = $(tile),
					$digits = $tile.find('.' + data.options.digit_wrapper_class),
					tile_data = $tile.data(plugin.namespace);
					if (!tile_data) {
						tile_data = { offset: 0, empty: isEmpty },
						$tile.data(plugin.namespace, tile_data);
					}
					if (isEmpty !== tile_data.empty) {
						tile_data.empty = isEmpty;
						$tile.data(plugin.namespace, tile_data);
					}

					// Get tile offset
					var offset = tile_data.empty ? 11 : (Math.floor(number / Math.pow(10, $tiles.length - ti - 1)) % 10);

					// Animate tiles if animating
					if (animate !== false) {
						tile_data.tw = new TweenLite(tile_data, data.options.spin_duration, {
							overwrite: true,
							ease: data.options.spin_ease,
							offset: offset,
							onUpdate: function() {
								$digits.css('transform', 'translateY(' + (tile_offset + (this.offset) * tile_height) + 'px)');
							},
							onUpdateScope: tile_data
						});
					}

					// Set tile position if not animating
					else {
						$digits.css('transform', 'translateY(' + (tile_offset + (offset) * tile_height) + 'px)'),
						tile_data.offset = offset;
					}

				});

				// Trim or hide excess tiles
				for (var ti = 0; ti < $tiles.length - displayLength; ti++) {
					if (animate !== false) $tiles.eq(ti).css('display', 'none');
					else $tiles.eq(ti).remove();
				}

				// Resize wrapper if animating
				var to_width = $this.width();

				if (animate !== false && to_width !== from_width) {

					// Get new width, reset current width, show excess tiles
					$this.width(from_width),
					$tiles.removeAttr('style');

					// Animate
					$this.stop().animate({'width': to_width}, {
						duration: data.options.resize_duration,

						// Remove styles and trim excess tiles on complete
						always: function() {
							$this.removeAttr('style');
							for (var ti = 0; ti < $tiles.length - displayLength; ti++) {
								$tiles.eq(ti).remove();
							}
						}

					});

				}

			});
		}


	},


	// Default options
	_defaults = {

		// Element settings
		tile_wrapper_class: 'tiles',
		tile_class: 'tile',
		digit_wrapper_class: 'digits',
		digit_class: 'digit',

		// Animation settings
		spin_duration: 1.5,
		spin_ease: 'Quad.easeInOut',
		resize_duration: 300,

		// Display settings
		min_digits: 0

	};


	// jQuery facade
	$.fn.numberSpinner = function() {

		// Call method
		if (arguments.length && typeof arguments[0] == 'string') {
			if ($.isFunction(plugin[arguments[0]])) return plugin[arguments[0]].apply(this, Array.prototype.slice.call(arguments, 1));
			else $.error('$.fn.' + plugin.namespace + ': Method \'' + arguments[0] + '\' does not exist');
		}

		// Initialise
		else {
			return plugin.initialise.apply(this, arguments);
		}

	}


})(jQuery);
