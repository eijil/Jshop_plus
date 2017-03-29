var winWidth = $(window).width();
var winHeight = $(window).height();
var CssEditor = null;
var HtmlEditor = null;
var postArgs = {};
var submit;
var allowSubmit = false;
var cssBox;
var htmlBox;
var body = $('body');
var container;
var editorBox;
var previewBox;
var previewUrl;
var previewiframe;
var moduleInfo = {};
var options = {
    fontSize: localStorage.getItem('ace_fontSize') || 14,
    theme: localStorage.getItem('ace_theme') || "ace/theme/github"
}


initDom();
AppendEditButton();
initEditor();


//初始化dom结构
function initDom() {
    var themes_dropdown = themeListDom();
    var editor =
        '<div class="jshop_plus ui modal">\
      <!--menu-->\
      <div class="ui jp-header top fixed menu">\
        <a class="item" id="toggleSideBar">\
          <i class="list layout icon"></i>\
        </a>\
        <div class="ui breadcrumb item"><!--content--></div>\
        <div class="right menu">\
          <div class="item" >\
            <div class="ui right small button blue"  id="submit">update</div>\
          </div>\
          <a class="ui item" id="setting_popup">\
            <i class="icon setting"></i>\
            <span class="text">setting</span>\
          </a>\
          <div class="ui popup bottom right">\
                  ' + themes_dropdown + '\
                  <div class="ui divider"></div>\
                  <div class="ui selection dropdown" id="dd_fontsize">\
                    <input type="hidden" name="FontSize">\
                    <i class="dropdown icon"></i>\
                    <div class="default text">FontSize</div>\
                    <div class="menu scrolling">\
                      <div class="item" data-value="12">12px</div>\
                      <div class="item" data-value="14">14px</div>\
                      <div class="item" data-value="16">16px</div>\
                    </div>\
                  </div>\
          </div>\
          <a class="item" data-content="Esc">\
            <div class="actions">\
              <i class="cancel icon remove"></i>\
            </div>\
          </a>\
        </div>\
      </div>\
      <div class="main-content" id="box">\
        <div class="ui sidebar inverted vertical menu" id="left_sidebar"></div>\
        <div class="boxes layout-top pusher">\
          <!--编辑容器-->\
          <div class="editor-boxes" id="editorBoxes">\
              <div class="css-box" id="cssBox">\
                <div class="code-box">\
                  <div class="" id="css-editor"></div>\
                </div>\
              </div>\
              <div id="vertical_bar">\
              </div>\
              <div class="html-box" id="htmlBox">\
                <div class="code-box">\
                  <div class="" id="html-editor"></div>\
                </div>\
              </div>\
          </div>\
          <div id="horizontal_bar">\
          </div>\
          <!--预览容器-->\
          <div class="preview-boxes" id="previewBoxes">\
              <iframe src=""\
                name="jshop_iframe"\
                allowfullscreen="true" sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-popups allow-modals allow-forms"\
                allowtransparency="true" class="preview-iframe" id="JSPpreviewiframe">\
              </iframe>\
          </div>\
        </div>\
      </div>\
    </div>';

    body.append(editor);
    container = $(".jshop_plus");
    submit = $('#submit');
    cssBox = $("#cssBox");
    htmlBox = $("#htmlBox");
    editorBox = $("#editorBoxes");
    previewBox = $("#previewBoxes");
    previewiframe = $('#JSPpreviewiframe');
    previewUrl = location.href.replace('visualEditing.html', 'preview.html');
    //init sidebar
    $('#left_sidebar')
        .sidebar({
            context: $('#box')
        })
        .sidebar('attach events', '#toggleSideBar');
};
//thmesSelect
function themeListDom() {

    var themeList = ace.require('ace/ext/themelist');

    var themesDom = '',
        darktheme = '',
        brighttheme = '';
    themeList.themes.forEach(function(theme) {
        var options = '<div class="item" data-value="' + theme.theme + '">' + theme.caption + '</div>';
        theme.isDark == true ? darktheme += options : brighttheme += options;
    });
    themesDom = '<div class="ui selection dropdown" id="dd_theme">\
                      <input type="hidden" name="Theme">\
                      <i class="dropdown icon"></i>\
                      <div class="default text">Theme</div>\
                      <div class="menu scrolling">\
                        <div class="header">Bright</div>\
                        ' + brighttheme + '\
                        <div class="header">Dark</div>\
                         ' + darktheme + '\
                      </div>\
                    </div>';

    return themesDom;
}

/*
 *
 */
function loadContent(firstload) {

    if (firstload == undefined) {
        firstload = true;
    }

    $.post('/decorate/mt/update.html?mtpDO.id=' + postArgs['mtp.id'])
        .done(function(data) {
            if (data === '') {
                return;
            }
            var dom = $.parseHTML(data);
            //设置提交参数
            setArgs(dom);
            //设置显示内容
            if (firstload) {
                setEditorContent();
            }
            allowSubmit = true;
        })
}
//提交参数
function setArgs($tempDom) {
    $.extend(postArgs, {
        'mtp.modPrototypeId': util.findDomFromList('#modPrototypeId', $tempDom).val(),
        'mtp.cssPath': util.findDomFromList('#csspath', $tempDom).val(),
        'mtp.contentPath': util.findDomFromList('#contextPath', $tempDom).val(),
        'mtp.cssId': util.findDomFromList('#moduleCssId', $tempDom).val(),
        'mtp.description': util.findDomFromList('#description', $tempDom).val(),
        'mtp.name': util.findDomFromList('#mtName', $tempDom).val(),
        'mtp.content': util.findDomFromList('#moduleEdit', $tempDom).val(),
        'mtp.css': util.findDomFromList('#templateCss', $tempDom).val(),
        'struts.token.name': util.findDomFromList('#strutsTokenName', $tempDom).val(),
        'struts.token': util.findDomFromList('#strutsTokenValue', $tempDom).val()
    })
}

function setEditorContent() {
    CssEditor.session.setValue(postArgs['mtp.css']);
    HtmlEditor.session.setValue(postArgs['mtp.content']);
    var breadcrumb =
        '<div class="section">' + moduleInfo['modename'] + '</div>\
       <div class="divider"> / </div>\
       <div class="active section">' + postArgs['mtp.name'] + '</div>';
    $(".breadcrumb").html(breadcrumb);
}

/*
 * 提交数据
 */
function update() {

    //button state
    submit.addClass('loading');
    //updateFiled
    var mtpContent = HtmlEditor.getValue();
    var cssCotent = CssEditor.getValue();
    //postArgs
    postArgs = $.extend(postArgs, {
        'mtp.css': cssCotent,
        'mtp.content': mtpContent
    })

    $.ajax({
            url: '/decorate/mt/doUpdateTemplatePrototype.html',
            type: 'post',
            data: postArgs
        })
        .done(function(result) {
            if (result === true) {
                loadContent(false);
                setiframe();
            } else {
                result = JSON.parse(result);
            }
            submit.removeClass('loading');
        })
}


var last_mtpId;

//绑定编辑按钮
function AppendEditButton() {
    var mCls = '.d-modules-line[module-name!=UserDefine]';
    var btn = '<button class="circular ui icon button blue show_editModal" title="编辑模板">\
                <i class="edit icon big" ></i>\
               </div>';
    $(mCls).each(function() {
        $(this).append(btn);
    });
    //bind event
    $('body').on('click', '.show_editModal', function() {
        var _this = $(this);
        moduleInfo['layoutId'] = $(this).parents('.d-layout').attr("id");
        moduleInfo['modeId'] = $(this).parents('.d-modules-line').attr('modeid');
        moduleInfo['modename'] = $(this).parents('.d-modules-line').attr('modename');
        postArgs['mtp.id'] = $(this).parents('.d-modules-line').attr('moduleclass').match(/[^-]*$/gi)[0];
        last_mtpId != postArgs['mtp.id'] && loadContent();
        last_mtpId = postArgs['mtp.id'];
        showEditModal();
    });

}
//显示编辑器
function showEditModal() {
    body.addClass('editEnable-body');
    container
        .modal({
            onShow: function() {
                onEditorShow();
            },
            onHide: function() {
                body.removeClass('editEnable-body');
            }
        })
        .modal('show');
};
/** 编辑器显示之后 **/
function onEditorShow() {
    $("#setting_popup").popup({
        on: 'click',
        position: 'bottom right',
        transition: 'scale',
        hoverable: true
    })
    submit.popup({
        content: 'Ctrl + S'
    })
    setiframe();
}

function initEditor() {

    CssEditor = ace.edit('css-editor');
    HtmlEditor = ace.edit('html-editor');
    setEditorOption(CssEditor);
    setEditorOption(HtmlEditor);
    HtmlEditor.session.setMode("ace/mode/velocity");
    CssEditor.session.setMode("ace/mode/css");


    //水平拖动
    $("#vertical_bar").draggable({
        axis: "x",
        drag: function(e, ui) {
            var offsetLeft = ui.offset.left;
            var leftWidth = offsetLeft;
            var rightWidth = winWidth - leftWidth + 16;
            cssBox.css('width', leftWidth);
            htmlBox.css('width', rightWidth);
            CssEditor.resize();
            HtmlEditor.resize();
        }
    });
    //垂直拖动
    $("#horizontal_bar").draggable({
        axis: "y",
        start: function() {
            //fix iframe
            previewiframe.css('z-index', -1);
        },
        stop: function() {
            previewiframe.css('z-index', 1);
        },
        drag: function(e, ui) {
            var positionTop = ui.position.top;
            var topHeight = positionTop;
            var bottomHeight = winHeight - topHeight;
            editorBox.css('height', topHeight);
            previewBox.css('height', bottomHeight);
            CssEditor.resize();
            HtmlEditor.resize();
        }
    })

    $("#dd_fontsize")
        .dropdown({
            onChange: function(value, text, $selectedItem) {
                setEditsOptions('setFontSize', Number(value));
                localStorage && localStorage.setItem('ace_fontSize', value);
            }
        });

    $("#dd_theme")
        .dropdown({
            onChange: function(value, text, $selectedItem) {
                setEditsOptions('setTheme', value);
                localStorage && localStorage.setItem('ace_theme', value);
            }
        });
    submit
        .on('click', function() {
            if (allowSubmit) {
                update();
            }
        })


}

function setEditorOption(editor) {
    //主题
    editor.setTheme(options.theme);
    //
    editor.setFontSize(Number(options.fontSize));
    //
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        wrap: 'free'
    });

    editor.commands.addCommands([{
        name: "update",
        bindKey: {
            win: "Ctrl-s",
            mac: "Command-s"
        },
        exec: function(editor) {
            //提交数据
            update();
        },
        readOnly: true
    }]);

}

function setEditsOptions(option, value) {
    CssEditor[option](value);
    HtmlEditor[option](value);
}

function setiframe() {
    previewiframe[0].src = previewUrl + '&t=' + (new Date).getTime() + '#' + moduleInfo['layoutId'];
}

var util = {
    findDomFromList: function(selector, $tempDom) {
        var retDom;
        $.each($tempDom, function(i, dom) {
            retDom = $(selector, dom);
            if (retDom.length) {
                return false; // break
            }
        });
        return retDom;
    }
}
