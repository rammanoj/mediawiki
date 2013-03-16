/**
 * jQuery makeCollapsible
 *
 * This will enable collapsible-functionality on all passed elements.
 * - Will prevent binding twice to the same element.
 * - Initial state is expanded by default, this can be overriden by adding class
 *   "mw-collapsed" to the "mw-collapsible" element.
 * - Elements made collapsible have jQuery data "mw-made-collapsible" set to true.
 * - The inner content is wrapped in a "div.mw-collapsible-content" (except for tables and lists).
 *
 * @author Krinkle, 2011-2012
 *
 * Dual license:
 * @license CC-BY 3.0 <http://creativecommons.org/licenses/by/3.0>
 * @license GPL2 <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>
 */
( function ( $, mw ) {

$.fn.makeCollapsible = function () {

	return this.each(function () {

		// Define reused variables and functions
		var lpx = 'jquery.makeCollapsible> ',
			collapsible = this,
			// Ensure class "mw-collapsible" is present in case .makeCollapsible()
			// is called on element(s) that don't have it yet.
			$collapsible = $(collapsible).addClass( 'mw-collapsible' ),
			collapsetext = $collapsible.attr( 'data-collapsetext' ),
			expandtext = $collapsible.attr( 'data-expandtext' ),
			$toggle,
			$toggleLink,
			$firstItem,
			collapsibleId,
			$customTogglers,
			firstval;

		/**
		 * @param {jQuery} $collapsible
		 * @param {string} action The action this function will take ('expand' or 'collapse').
		 * @param {jQuery|null} [optional] $defaultToggle
		 * @param {Object|undefined} options
		 */
		function toggleElement( $collapsible, action, $defaultToggle, options ) {
			var $collapsibleContent, $containers;
			options = options || {};

			// Validate parameters

			// $collapsible must be an instance of jQuery
			if ( !$collapsible.jquery ) {
				return;
			}
			if ( action !== 'expand' && action !== 'collapse' ) {
				// action must be string with 'expand' or 'collapse'
				return;
			}
			if ( $defaultToggle === undefined ) {
				$defaultToggle = null;
			}
			if ( $defaultToggle !== null && !$defaultToggle.jquery ) {
				// is optional (may be undefined), but if defined it must be an instance of jQuery.
				// If it's not, abort right away.
				// After this $defaultToggle is either null or a valid jQuery instance.
				return;
			}

			// Handle different kinds of elements

			if ( $collapsible.is( 'table' ) ) {
				// Tables
				$containers = $collapsible.find( '> tbody > tr' );
				if ( $defaultToggle ) {
					// Exclude table row containing togglelink
					$containers = $containers.not( $defaultToggle.closest( 'tr' ) );
				}

				if ( action === 'collapse' ) {
					// Hide all table rows of this table
					// Slide doesn't work with tables, but fade does as of jQuery 1.1.3
					// http://stackoverflow.com/questions/467336#920480
					if ( options.instantHide ) {
						$containers.hide();
					} else {
						$containers.stop( true, true ).fadeOut();
					}
				} else {
					$containers.stop( true, true ).fadeIn();
				}

			} else if ( $collapsible.is( 'ul' ) || $collapsible.is( 'ol' ) ) {
				// Lists
				$containers = $collapsible.find( '> li' );
				if ( $defaultToggle ) {
					// Exclude list-item containing togglelink
					$containers = $containers.not( $defaultToggle.parent() );
				}

				if ( action === 'collapse' ) {
					if ( options.instantHide ) {
						$containers.hide();
					} else {
						$containers.stop( true, true ).slideUp();
					}
				} else {
					$containers.stop( true, true ).slideDown();
				}

			} else {
				// Everything else: <div>, <p> etc.
				$collapsibleContent = $collapsible.find( '> .mw-collapsible-content' );

				// If a collapsible-content is defined, act on it
				if ( $collapsibleContent.length ) {
					if ( action === 'collapse' ) {
						if ( options.instantHide ) {
							$collapsibleContent.hide();
						} else {
							$collapsibleContent.slideUp();
						}
					} else {
						$collapsibleContent.slideDown();
					}

				// Otherwise assume this is a customcollapse with a remote toggle
				// .. and there is no collapsible-content because the entire element should be toggled
				} else {
					if ( action === 'collapse' ) {
						if ( options.instantHide ) {
							$collapsible.hide();
						} else {
							if ( $collapsible.is( 'tr' ) || $collapsible.is( 'td' ) || $collapsible.is( 'th' ) ) {
								$collapsible.fadeOut();
							} else {
								$collapsible.slideUp();
							}
						}
					} else {
						if ( $collapsible.is( 'tr' ) || $collapsible.is( 'td' ) || $collapsible.is( 'th' ) ) {
							$collapsible.fadeIn();
						} else {
							$collapsible.slideDown();
						}
					}
				}
			}
		}

		/**
		 * Handles clicking on the collapsible element toggle and other
		 * situations where a collapsible element is toggled (e.g. the initial
		 * toggle for collapsed ones).
		 *
		 * @param {jQuery} $toggle the clickable toggle itself
		 * @param {jQuery} $collapsible the collapsible element
		 * @param {jQuery.Event|null} e either the event or null if unavailable
		 * @param {Object|undefined} options
		 */
		function togglingHandler( $toggle, $collapsible, event, options ) {
			var wasCollapsed, $textContainer, collapseText, expandText;

			if ( event ) {
				// Don't fire if a link was clicked, if requested (for premade togglers by default)
				if ( options.linksPassthru && $.nodeName( event.target, 'a' ) ) {
					return true;
				} else {
					event.preventDefault();
					event.stopPropagation();
				}
			}

			wasCollapsed = $collapsible.hasClass( 'mw-collapsed' );

			// Toggle the state of the collapsible element (that is, expand or collapse)
			$collapsible.toggleClass( 'mw-collapsed', !wasCollapsed );

			// Toggle the mw-collapsible-toggle classes, if requested (for default and premade togglers by default)
			if ( options.toggleClasses ) {
				$toggle
					.toggleClass( 'mw-collapsible-toggle-collapsed', !wasCollapsed )
					.toggleClass( 'mw-collapsible-toggle-expanded', wasCollapsed );
			}

			// Toggle the text ("Show"/"Hide"), if requested (for default togglers by default)
			if ( options.toggleText ) {
				collapseText = options.toggleText.collapseText;
				expandText = options.toggleText.expandText;

				$textContainer = $toggle.find( '> a' );
				if ( !$textContainer.length ) {
					$textContainer = $toggle;
				}
				$textContainer.text( wasCollapsed ? collapseText : expandText );
			}

			// And finally toggle the element state itself
			toggleElement( $collapsible, wasCollapsed ? 'expand' : 'collapse', $toggle, options );
		}

		/**
		 * Toggles collapsible and togglelink class and updates text label.
		 *
		 * @param {jQuery} $that
		 * @param {jQuery.Event} e
		 * @param {Object|undefined} options
		 */
		function toggleLinkDefault( $that, e, options ) {
			var $collapsible = $that.closest( '.mw-collapsible' );
			options = $.extend( { toggleClasses: true }, options );
			togglingHandler( $that, $collapsible, e, options );
		}

		/**
		 * Toggles collapsible and togglelink class.
		 *
		 * @param {jQuery} $that
		 * @param {jQuery.Event} e
		 * @param {Object|undefined} options
		 */
		function toggleLinkPremade( $that, e, options ) {
			var $collapsible = $that.eq( 0 ).closest( '.mw-collapsible' );
			options = $.extend( { toggleClasses: true }, options );
			togglingHandler( $that, $collapsible, e, options );
		}

		/**
		 * Toggles customcollapsible.
		 *
		 * @param {jQuery} $that
		 * @param {jQuery.Event} e
		 * @param {Object|undefined} options
		 * @param {jQuery} $collapsible
		 */
		function toggleLinkCustom( $that, e, options, $collapsible ) {
			options = $.extend( { linksPassthru: true }, options );
			togglingHandler( $that, $collapsible, e, options );
		}

		// Return if it has been enabled already.
		if ( $collapsible.data( 'mw-made-collapsible' ) ) {
			return;
		} else {
			$collapsible.data( 'mw-made-collapsible', true );
		}

		// Use custom text or default ?
		if ( !collapsetext ) {
			collapsetext = mw.msg( 'collapsible-collapse' );
		}
		if ( !expandtext ) {
			expandtext = mw.msg( 'collapsible-expand' );
		}

		// Create toggle link with a space around the brackets (&nbsp;[text]&nbsp;)
		$toggleLink =
			$( '<a href="#"></a>' )
				.text( collapsetext )
				.wrap( '<span class="mw-collapsible-toggle"></span>' )
					.parent()
					.prepend( '&nbsp;[' )
					.append( ']&nbsp;' )
					.on( 'click.mw-collapse', function ( e, options ) {
						options = $.extend( { toggleText: { collapseText: collapsetext, expandText: expandtext } }, options );
						toggleLinkDefault( $(this), e, options );
					} );

		// Check if this element has a custom position for the toggle link
		// (ie. outside the container or deeper inside the tree)
		// Then: Locate the custom toggle link(s) and bind them
		if ( ( $collapsible.attr( 'id' ) || '' ).indexOf( 'mw-customcollapsible-' ) === 0 ) {

			collapsibleId = $collapsible.attr( 'id' );
			$customTogglers = $( '.' + collapsibleId.replace( 'mw-customcollapsible', 'mw-customtoggle' ) );
			mw.log( lpx + 'Found custom collapsible: #' + collapsibleId );

			// Double check that there is actually a customtoggle link
			if ( $customTogglers.length ) {
				$customTogglers.on( 'click.mw-collapse', function ( e, options ) {
					toggleLinkCustom( $(this), e, options, $collapsible );
				} );
			} else {
				mw.log( lpx + '#' + collapsibleId + ': Missing toggler!' );
			}

			// Initial state
			if ( $collapsible.hasClass( 'mw-collapsed' ) ) {
				// Remove here so that the toggler goes in the right direction,
				// It re-adds the class.
				$collapsible.removeClass( 'mw-collapsed' );
				toggleLinkCustom( $customTogglers, null, { instantHide: true }, $collapsible );
			}

		// If this is not a custom case, do the default:
		// Wrap the contents add the toggle link
		} else {

			// Elements are treated differently
			if ( $collapsible.is( 'table' ) ) {
				// The toggle-link will be in one the the cells (td or th) of the first row
				$firstItem = $collapsible.find( 'tr:first th, tr:first td' );
				$toggle = $firstItem.find( '> .mw-collapsible-toggle' );

				// If theres no toggle link, add it to the last cell
				if ( !$toggle.length ) {
					$firstItem.eq(-1).prepend( $toggleLink );
				} else {
					$toggleLink = $toggle.off( 'click.mw-collapse' ).on( 'click.mw-collapse', function ( e, options ) {
						toggleLinkPremade( $toggle, e, options );
					} );
				}

			} else if ( $collapsible.is( 'ul' ) || $collapsible.is( 'ol' ) ) {
				// The toggle-link will be in the first list-item
				$firstItem = $collapsible.find( 'li:first' );
				$toggle = $firstItem.find( '> .mw-collapsible-toggle' );

				// If theres no toggle link, add it
				if ( !$toggle.length ) {
					// Make sure the numeral order doesn't get messed up, force the first (soon to be second) item
					// to be "1". Except if the value-attribute is already used.
					// If no value was set WebKit returns "", Mozilla returns '-1', others return null or undefined.
					firstval = $firstItem.attr( 'value' );
					if ( firstval === undefined || !firstval || firstval === '-1' || firstval === -1 ) {
						$firstItem.attr( 'value', '1' );
					}
					$collapsible.prepend( $toggleLink.wrap( '<li class="mw-collapsible-toggle-li"></li>' ).parent() );
				} else {
					$toggleLink = $toggle.off( 'click.mw-collapse' ).on( 'click.mw-collapse', function ( e, options ) {
						toggleLinkPremade( $toggle, e, options );
					} );
				}

			} else { // <div>, <p> etc.

				// The toggle-link will be the first child of the element
				$toggle = $collapsible.find( '> .mw-collapsible-toggle' );

				// If a direct child .content-wrapper does not exists, create it
				if ( !$collapsible.find( '> .mw-collapsible-content' ).length ) {
					$collapsible.wrapInner( '<div class="mw-collapsible-content"></div>' );
				}

				// If theres no toggle link, add it
				if ( !$toggle.length ) {
					$collapsible.prepend( $toggleLink );
				} else {
					$toggleLink = $toggle.off( 'click.mw-collapse' ).on( 'click.mw-collapse', function ( e, options ) {
						toggleLinkPremade( $toggle, e, options );
					} );
				}
			}
		}

		// Initial state (only for those that are not custom,
		// because the initial state of those has been taken care of already).
		if ( $collapsible.hasClass( 'mw-collapsed' ) && ( $collapsible.attr( 'id' ) || '').indexOf( 'mw-customcollapsible-' ) !== 0 ) {
			$collapsible.removeClass( 'mw-collapsed' );
			// The collapsible element could have multiple togglers
			// To toggle the initial state only click one of them (ie. the first one, eq(0) )
			// Else it would go like: hide,show,hide,show for each toggle link.
			// This is just like it would be in reality (only one toggle is clicked at a time).
			$toggleLink.eq( 0 ).trigger( 'click', [ { instantHide: true } ] );
		}
	} );
};

}( jQuery, mediaWiki ) );
