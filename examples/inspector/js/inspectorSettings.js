/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var LC_KEY_INSPECTOR_SETTINGS = "Inspector Options";

var state = loadSettingsFromStorage(LC_KEY_INSPECTOR_SETTINGS);

var stateDefaults = {
  folderOpen: true,
  debugPanelId: "settingsContainer",
  profileStartup: false,
  profileStartupDuration: 10000,
  logToConsole: true,
  logToDebugPanel: false,
  logAssets: false,
  logScratchCanvases: false,
  overlayFlash: false,
  fileReadChunkSize: 0,
  mute: false,
  release: true,
  salign: 'tl',
  scale: 'noscale',
  width: -1,
  height: -1,
  loaderURL: '',
  remoteEnabled: false,
  remoteSWF: '',
  remoteAutoReload: true,
  recordingLimit: 0,
  flashlogEnabled: false
};

for (var option in stateDefaults) {
  if (typeof state[option] === "undefined") {
    state[option] = stateDefaults[option];
  }
}

function loadSettingsFromStorage(key) {
  try {
    var lsValue = window.localStorage[key];
    if (lsValue) {
      return JSON.parse(lsValue);
    }
  } catch (e) {}
  return {};
}

function saveSettingsToStorage(key, settings) {
  try {
    var lsValue = JSON.stringify(settings);
    window.localStorage[key] = lsValue;
  } catch (e) {
  }
}

function saveInspectorState() {
  saveSettingsToStorage(LC_KEY_INSPECTOR_SETTINGS, state);
}

function createOptionsGUI() {
  var Option = Shumway.Options.Option;
  var OptionSet = Shumway.Options.OptionSet;

  var gui = new dat.GUI({ autoPlace: false, width: 300 });
  gui.add({ "Reset Options": resetOptions }, "Reset Options");
  gui.add({ "Stage Scale Test": stageScaleTest }, "Stage Scale Test");
  gui.add({ "Take Screen Shot": screenShot }, "Take Screen Shot");

  var inspectorOptions = gui.addFolder("Inspector Options");
  inspectorOptions.add(state, "release").onChange(saveInspectorOption);
  inspectorOptions.add(state, "logToConsole").onChange(saveInspectorOption);
  inspectorOptions.add(state, "logToDebugPanel").onChange(saveInspectorOption);
  inspectorOptions.add(state, "logAssets").onChange(saveInspectorOption);
  inspectorOptions.add(state, "logScratchCanvases").onChange(saveInspectorOption);
  inspectorOptions.add(state, "profileStartup").onChange(saveInspectorOption);
  inspectorOptions.add(state, "profileStartupDuration").onChange(saveInspectorOption);
  inspectorOptions.add(state, "overlayFlash").onChange(saveInspectorOption);
  inspectorOptions.add(state, "fileReadChunkSize").onChange(saveInspectorOption);
  inspectorOptions.add(state, "scale").options({
    "ShowAll": 'showall',
    "ExactFit": 'exactfit',
    "NoBorder": 'noborder',
    "NoScale": 'noscale'
  }).onChange(saveInspectorOption);
  inspectorOptions.add(state, "salign").options({
    "None": '',
    "Top": 't',
    "Left": 'l',
    "Bottom": 'b',
    "Right": 'r',
    "Top Left": 'tl',
    "Bottom Left": 'bl',
    "Bottom Right": 'br',
    "Top Right": 'tr'
  }).onChange(saveInspectorOption);
  inspectorOptions.add(state, "width", -1, 4096, 1).onChange(saveInspectorOption);
  inspectorOptions.add(state, "height", -1, 4096, 1).onChange(saveInspectorOption);
  inspectorOptions.add(state, "loaderURL").onChange(saveInspectorOption);
  inspectorOptions.add(state, "remoteEnabled").onChange(saveInspectorOption);
  inspectorOptions.add(state, "remoteSWF").onChange(saveInspectorOption);
  inspectorOptions.add(state, "remoteAutoReload").onChange(saveInspectorOption);
  inspectorOptions.add(state, "recordingLimit").onChange(saveInspectorOption);
  inspectorOptions.add(state, "flashlogEnabled").onChange(saveInspectorOption);
  //inspectorOptions.add(state, "mute").onChange(saveInspectorOption);
  if (state.folderOpen) {
    inspectorOptions.open();
  }

  gui.add({ "Save Recording": saveRecording }, "Save Recording");

  gui.domElement.addEventListener("click", function(e) {
    if (e.target.nodeName.toLowerCase() == "li" && e.target.classList.contains("title")) {
      var isOpen = !e.target.parentElement.classList.contains("closed");
      var option = findOptionSetByName(e.target.textContent,
                                       Shumway.Settings.shumwayOptions);
      if (option) {
        option.open = isOpen;
        saveSettingsToStorage(Shumway.Settings.ROOT, Shumway.Settings.getSettings());
        notifyOptionsChanged();
      } else {
        if (e.target.textContent === "Inspector Options") {
          state.folderOpen = isOpen;
          saveInspectorState();
        }
      }
    }
  });

  function resetOptions() {
    delete window.localStorage[Shumway.Settings.ROOT];
    delete window.localStorage[LC_KEY_INSPECTOR_SETTINGS];
  }

  function stageScaleTest() {
    var ticks = 2000;
    var s = 0;
    var easelContainer = document.getElementById('easelContainer');
    function tick() {
      s += 0.01;
      if (ticks > 1500) {
        var w = 512 * (Math.abs(Math.sin(s)));
        var h = w;
      } else if (ticks > 1000) {
        var w = 512 * (Math.abs(Math.sin(s)));
        var h = 200;
      } else if (ticks > 500) {
        var w = 200;
        var h = 512 * (Math.abs(Math.sin(s)));
      } else {
        var w = Math.random() * 1024 | 0;
        var h = Math.random() * 1024 | 0;
      }
      easelContainer.style.width = w + 'px';
      easelContainer.style.height = h + 'px';
      if (ticks --) {
        setTimeout(tick, 16);
      }
    }
    tick();
  }

  function screenShot() {
    var screenShot = currentEasel.screenShot(undefined, true);
    var w = window.open(screenShot.dataURL, 'screenShot', 'height=' + screenShot.w + ', width=' + screenShot.h);
    w.document.title = 'Shumway Screen Shot';
  }

  function saveRecording() {
    if (typeof easelHost === 'undefined' || !easelHost.recorder) {
      return;
    }

    var blob = easelHost.recorder.getRecording();

    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.target = '_parent';
    a.download = 'movie.swfm';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
  }

  function notifyOptionsChanged() {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('shumwayOptionsChanged', false, false, null);
    document.dispatchEvent(event);
  }

  function saveInspectorOption(value) {
    state[this.property] = value;
    saveInspectorState();

    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('inspectorOptionsChanged', false, false, {property: this.property});
    document.dispatchEvent(event);
  }

  function findOptionSetByName(name, optionSet) {
    for (var i = 0, n = optionSet.options.length; i < n; i++) {
      var option = optionSet.options[i];
      if (OptionSet.isOptionSet(option)) {
        if (option.name === name) {
          return option;
        } else {
          var child = findOptionSetByName(name, option);
          if (child) {
            return child;
          }
        }
      }
    }
    return null;
  }

  function addTooltip(ctrl, text) {
    var el = ctrl.domElement;
    while ((el = el.parentElement)) {
      if (el.classList.contains("cr")) {
        el.setAttribute("title", text);
      }
    }
  }

  function addOptionSet(parent, optionSet) {
    var ctrl, folder;
    var isObject = Shumway.isObject;
    var isNullOrUndefined = Shumway.isNullOrUndefined;
    optionSet.options.forEach(function(option) {
      if (OptionSet.isOptionSet(option)) {
        folder = parent.addFolder(option.name);
        if (option.open) { folder.open(); }
        addOptionSet(folder, option);
      } else {
        if (!isNullOrUndefined(option.config) && isObject(option.config)) {
          if (isObject(option.config.list)) {
            ctrl = parent.add(option, "value", option.config.list);
          } else if (isObject(option.config.choices)) {
            ctrl = parent.add(option, "value", option.config.choices);
          } else if (isObject(option.config.range)) {
            var range = option.config.range;
            ctrl = parent.add(option, "value").min(range.min).max(range.max).step(range.step);
          } else {
            ctrl = parent.add(option, "value");
          }
        } else {
          ctrl = parent.add(option, "value");
        }
        ctrl.name(option.longName);
        ctrl.onChange(function() {
          notifyOptionsChanged();
        });
        addTooltip(ctrl, option.description);
        option.ctrl = ctrl;
      }
    });
  }

  addOptionSet(gui, Shumway.Settings.shumwayOptions);

  document.getElementById("settingsContainer").appendChild(gui.domElement);

  window.GUI = gui;
}

function mergeOptionSets(destSet, otherSet) {
  // Merging sets from the different iframes.
  var OptionSet = Shumway.Options.OptionSet;
  var index = {};
  otherSet.options.forEach(function (option) {
    index[option.name] = option;
  });
  destSet.options.forEach(function (option) {
    var otherOption = index[option.name];
    if (otherOption === undefined) {
      return;
    }
    if (OptionSet.isOptionSet(option)) {
      if (OptionSet.isOptionSet(otherOption)) {
        mergeOptionSets(option, otherOption);
      }
    } else {
      // Replacing data 'value' properties to the getters/setters on options
      // that are present in both iframes.
      Object.defineProperty(otherOption, 'value', {
        get: function() { return option.value; },
        set: function (value) { option.value = value; },
        enumerable: true,
        configurable: true
      })
    }
    index[option.name] = undefined;
  });
  // Adding non-existent options to the main options set.
  for (var name in index) {
    if (index[name] !== undefined) {
      destSet.options.push(index[name]);
    }
  }
}
