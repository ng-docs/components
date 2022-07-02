entryPoints = [
    "column-resize",
    "mdc-autocomplete",
    "mdc-autocomplete/testing",
    "mdc-button",
    "mdc-button/testing",
    "mdc-card",
    "mdc-card/testing",
    "mdc-checkbox",
    "mdc-checkbox/testing",
    "mdc-chips",
    "mdc-chips/testing",
    "mdc-core",
    "mdc-core/testing",
    "mdc-dialog",
    "mdc-dialog/testing",
    "mdc-form-field",
    "mdc-form-field/testing",
    "mdc-input",
    "mdc-input/testing",
    "mdc-list",
    "mdc-list/testing",
    "mdc-menu",
    "mdc-menu/testing",
    "mdc-paginator",
    "mdc-paginator/testing",
    "mdc-progress-bar",
    "mdc-progress-bar/testing",
    "mdc-progress-spinner",
    "mdc-progress-spinner/testing",
    "mdc-radio",
    "mdc-radio/testing",
    "mdc-select",
    "mdc-select/testing",
    "mdc-slide-toggle",
    "mdc-slide-toggle/testing",
    "mdc-slider",
    "mdc-slider/testing",
    "mdc-snack-bar",
    "mdc-snack-bar/testing",
    "mdc-table",
    "mdc-table/testing",
    "mdc-tabs",
    "mdc-tabs/testing",
    "mdc-tooltip",
    "mdc-tooltip/testing",
    "menubar",
    "popover-edit",
    "selection",
]

# List of all non-testing entry-points of the Angular material-experimental package.
MATERIAL_EXPERIMENTAL_ENTRYPOINTS = [
    ep
    for ep in entryPoints
    if not "/testing" in ep
]

# List of all testing entry-points of the Angular material-experimental package.
MATERIAL_EXPERIMENTAL_TESTING_ENTRYPOINTS = [
    ep
    for ep in entryPoints
    if not ep in MATERIAL_EXPERIMENTAL_ENTRYPOINTS
]

# List of all non-testing entry-point targets of the Angular material-experimental package.
MATERIAL_EXPERIMENTAL_TARGETS = ["//src/material-experimental"] + \
                                ["//src/material-experimental/%s" % ep for ep in MATERIAL_EXPERIMENTAL_ENTRYPOINTS]

# List of all testing entry-point targets of the Angular material-experimental package.
MATERIAL_EXPERIMENTAL_TESTING_TARGETS = ["//src/material-experimental/%s" % ep for ep in MATERIAL_EXPERIMENTAL_TESTING_ENTRYPOINTS]

MATERIAL_EXPERIMENTAL_SCSS_LIBS = [
    "//src/material-experimental/%s:%s_scss_lib" % (ep, ep.replace("-", "_"))
    # Only secondary entry-points declare theme files currently. Entry-points
    # which contain a slash are not in the top-level.
    for ep in MATERIAL_EXPERIMENTAL_ENTRYPOINTS
    if not "/" in ep
]
