// Copyright (c) 2021, Vijay and contributors
// For license information, please see license.txt
frappe.provide("frappe.views");

frappe.ui.form.on("Tab Report", {
  onload: function (frm) {
    frm.tab_report = new frappe.views.TabReport({ frm: frm });
    frm.tab_report.show();
  },

  refresh: function (frm) {
    frm.tab_report.load_report();
  },
});

frappe.views.TabReport = class TabReport {
  constructor(opts) {
    Object.assign(this, opts);
  }

  show() {
    frappe.run_serially([() => this.init()]);
  }

  init() {
    if (this.init_promise) return this.init_promise;

    let tasks = [this.setup_defaults].map((fn) => fn.bind(this));

    this.init_promise = frappe.run_serially(tasks);
    return this.init_promise;
  }

  setup_defaults() {
    // set full-width
    this.frm.$wrapper.find(".container.page-body").addClass("col-md-12");
    $("<div id='tab-report' class='table-bordered'></div>").appendTo(
      this.frm.fields_dict["report_html"].$wrapper
    );
  }

  load_report() {
    this.frm.page.clear_fields();
    this.report_name = this.frm.doc.report_name;

    frappe.run_serially([
      () => this.get_report_doc(),
      () => this.get_report_settings(),
      () => this.refresh_report(),
    ]);
  }

  get_report_doc() {}

  refresh_report() {
    // this.toggle_message(true);

    return frappe.run_serially([
      // () => this.setup_filters(),
      // () => this.set_route_filters(),
      // () => this.report_settings.onload && this.report_settings.onload(this),
      // () => this.get_user_settings(),
      () => this.refresh(),
    ]);
  }

  toggle_message(flag, message) {
    // if (flag) {
    //   this.$message.find("div").html(message);
    //   this.$message.show();
    // } else {
    //   this.$message.hide();
    // }
    // this.$report.toggle(!flag);
  }

  get_filter_values(raise) {
    return {};
  }

  refresh() {
    this.toggle_message(true);
    let filters = this.get_filter_values(true);

    // only one refresh at a time
    if (this.last_ajax) {
      this.last_ajax.abort();
    }

    return new Promise((resolve) => {
      this.last_ajax = frappe.call({
        method: "frappe.desk.query_report.run",
        type: "GET",
        args: {
          report_name: this.report_name,
          filters: filters,
        },
        callback: resolve,
        always: () => this.frm.page.btn_secondary.prop("disabled", false),
      });
    }).then((r) => {
      let data = r.message;
      // this.hide_status();
      // clearInterval(this.interval);

      this.execution_time = data.execution_time || 0.1;

      // this.toggle_message(false);
      if (data.result && data.result.length) {
        this.prepare_report_data(data);
        this.render_datatable();
      } else {
        this.data = [];
        this.toggle_nothing_to_show(true);
      }
      // this.show_footer_message();
    });
  }

  prepare_report_data(data) {
    this.data = data;

    // prepare columns
    this.data.columns.forEach((t) => {
      t.title = t.label;
      t.field = t.fieldname;
    });
    // set column cell formatter for known fieldtypes, if not provided already in report_settings
    // list of Tabulator formatters:  http://tabulator.info/docs/4.9/format
    this.data.columns.forEach((col) => {
      if (!col.formatter) {
        this.set_column_formatter(col);
      }
    });
  }

  set_column_formatter(col) {
    if (!col.fieldtype || col.fieldtype == "") {
      if (
        this.data &&
        this.data.result &&
        this.data.result.length &&
        is_html(this.data.result[0][col.fieldname])
      )
        col.formatter = "html";
    } else if (col.fieldtype == "Link") {
      col.formatter = function (cell) {
        return `<a href='desk#Form/${
          col.options
        }/${cell.getValue()}'>${cell.getValue()}</a>`;
      };
    }
  }

  render_datatable() {
    console.log(this.data);
    if (this.tabulator) {
      $("#tab-report").tabulator("destroy");
    }
    let opts = this.report_settings.opts || {};
    Object.assign(opts, { height: `${this.frm.doc.height}px` });
    this.tabulator = new Tabulator("#tab-report", opts);
    this.tabulator.setColumns(this.data.columns);
    this.tabulator.setData(this.data.result);
  }

  get_report_settings() {
    return new Promise((resolve, reject) => {
      if (frappe.query_reports[this.frm.doc.report_name]) {
        this.report_settings = frappe.query_reports[this.frm.doc.report_name];
        resolve();
      } else {
        frappe
          .xcall("frappe.desk.query_report.get_script", {
            report_name: this.frm.doc.report_name,
          })
          .then((settings) => {
            frappe.dom.eval(settings.script || "");
            frappe.after_ajax(() => {
              this.report_settings = this.get_local_report_settings();
              this.report_settings.html_format = settings.html_format;
              this.report_settings.execution_time =
                settings.execution_time || 0;
              frappe.query_reports[this.report_name] = this.report_settings;
              console.log(this.report_settings);
              resolve();
            });
          })
          .catch(reject);
      }
    });
  }

  get_local_report_settings() {
    return frappe.query_reports[this.report_name] || {};
  }
};

// TODO: move to utils
function is_html(str) {
  return basic_html.test(str) || full_html.test(str);
}

const HTML_TAGS = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "math",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rb",
  "rp",
  "rt",
  "rtc",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "svg",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
];

const basic_html = /\s?<!doctype html>|(<html\b[^>]*>|<body\b[^>]*>|<x-[^>]+>)+/i;
const full_html = new RegExp(
  HTML_TAGS.map((tag) => `<${tag}\\b[^>]*>`).join("|"),
  "i"
);
