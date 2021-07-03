import { QWeb } from "../qweb/index";
import { INTERP_REGEXP } from "../qweb/compilation_context";
import { makeHandlerCode, MODS_CODE } from "../qweb/extensions";
import { STATUS } from "./component";

//------------------------------------------------------------------------------
// t-component
//------------------------------------------------------------------------------

const T_COMPONENT_MODS_CODE = Object.assign({}, MODS_CODE, {
  self: "if (e.target !== vn.elm) {return}",
});

QWeb.utils.defineProxy = function defineProxy(target, source) {
  for (let k in source) {
    Object.defineProperty(target, k, {
      get() {
        return source[k];
      },
      set(val) {
        source[k] = val;
      },
    });
  }
};

QWeb.utils.assignHooks = function assignHooks(dataObj, hooks) {
  if ("hook" in dataObj) {
    const hookObject = dataObj.hook;
    for (let name in hooks) {
      const current = hookObject[name];
      const fn = hooks[name];
      if (current) {
        hookObject[name] = (...args) => {
          current(...args);
          fn(...args);
        };
      } else {
        hookObject[name] = fn;
      }
    }
  } else {
    dataObj.hook = hooks;
  }
};

/**
 * The t-component directive is certainly a complicated and hard to maintain piece
 * of code.  To help you, fellow developer, if you have to maintain it, I offer
 * you this advice: Good luck...
 *
 * Since it is not 'direct' code, but rather code that generates other code, it
 * is not easy to understand.  To help you, here  is a detailed and commented
 * explanation of the code generated by the t-component directive for the following
 * situation:
 * ```xml
 *   <Child
 *      t-key="'somestring'"
 *      flag="state.flag"
 *      t-transition="fade"/>
 * ```
 *
 * ```js
 * // we assign utils on top of the function because it will be useful for
 * // each components
 * let utils = this.utils;
 *
 * // this is the virtual node representing the parent div
 * let c1 = [], p1 = { key: 1 };
 * var vn1 = h("div", p1, c1);
 *
 * // t-component directive: we start by evaluating the expression given by t-key:
 * let key5 = "somestring";
 *
 * // def3 is the promise that will contain later either the new component
 * // creation, or the props update...
 * let def3;
 *
 * // this is kind of tricky: we need here to find if the component was already
 * // created by a previous rendering.  This is done by checking the internal
 * // `cmap` (children map) of the parent component: it maps keys to component ids,
 * // and, then, if there is an id, we look into the children list to get the
 * // instance
 * let w4 =
 *   key5 in context.__owl__.cmap
 *   ? context.__owl__.children[context.__owl__.cmap[key5]]
 *   : false;
 *
 * // We keep the index of the position of the component in the closure.  We push
 * // null to reserve the slot, and will replace it later by the component vnode,
 * // when it will be ready (do not forget that preparing/rendering a component is
 * // asynchronous)
 * let _2_index = c1.length;
 * c1.push(null);
 *
 * // we evaluate here the props given to the component. It is done here to be
 * // able to easily reference it later, and also, it might be an expensive
 * // computation, so it is certainly better to do it only once
 * let props4 = { flag: context["state"].flag };
 *
 * // If we have a component, currently rendering, but not ready yet, we do not want
 * // to wait for it to be ready if we can avoid it
 * if (w4 && w4.__owl__.renderPromise && !w4.__owl__.vnode) {
 *   // we check if the props are the same.  In that case, we can simply reuse
 *   // the previous rendering and skip all useless work
 *   if (utils.shallowEqual(props4, w4.__owl__.renderProps)) {
 *     def3 = w4.__owl__.renderPromise;
 *   } else {
 *     // if the props are not the same, we destroy the component and starts anew.
 *     // this will be faster than waiting for its rendering, then updating it
 *     w4.destroy();
 *     w4 = false;
 *   }
 * }
 *
 * if (!w4) {
 *   // in this situation, we need to create a new component.  First step is
 *   // to get a reference to the class, then create an instance with
 *   // current context as parent, and the props.
 *   let W4 = context.component && context.components[componentKey4] || QWeb.component[componentKey4];

 *   if (!W4) {
 *     throw new Error("Cannot find the definition of component 'child'");
 *   }
 *   w4 = new W4(owner, props4);
 *
 *   // Whenever we rerender the parent component, we need to be sure that we
 *   // are able to find the component instance. To do that, we register it to
 *   // the parent cmap (children map).  Note that the 'template' key is
 *   // used here, since this is what identify the component from the template
 *   // perspective.
 *   context.__owl__.cmap[key5] = w4.__owl__.id;
 *
 *   // __prepare is called, to basically call willStart, then render the
 *   // component
 *   def3 = w4.__prepare();
 *
 *   def3 = def3.then(vnode => {
 *     // we create here a virtual node for the parent (NOT the component). This
 *     // means that the vdom of the parent will be stopped here, and from
 *     // the parent's perspective, it simply is a vnode with no children.
 *     // However, it shares the same dom element with the component root
 *     // vnode.
 *     let pvnode = h(vnode.sel, { key: key5 });
 *
 *     // we add hooks to the parent vnode so we can interact with the new
 *     // component at the proper time
 *     pvnode.data.hook = {
 *       insert(vn) {
 *         // the __mount method will patch the component vdom into the elm vn.elm,
 *         // then call the mounted hooks. However, suprisingly, the snabbdom
 *         // patch method actually replace the elm by a new elm, so we need
 *         // to synchronise the pvnode elm with the resulting elm
 *         let nvn = w4.__mount(vnode, vn.elm);
 *         pvnode.elm = nvn.elm;
 *         // what follows is only present if there are animations on the component
 *         utils.transitionInsert(vn, "fade");
 *       },
 *       remove() {
 *         // override with empty function to prevent from removing the node
 *         // directly. It will be removed when destroy is called anyway, which
 *         // delays the removal if there are animations.
 *       },
 *       destroy() {
 *         // if there are animations, we delay the call to destroy on the
 *         // component, if not, we call it directly.
 *         let finalize = () => {
 *           w4.destroy();
 *         };
 *         utils.transitionRemove(vn, "fade", finalize);
 *       }
 *     };
 *     // the pvnode is inserted at the correct position in the div's children
 *     c1[_2_index] = pvnode;
 *
 *     // we keep here a reference to the parent vnode (representing the
 *     // component, so we can reuse it later whenever we update the component
 *     w4.__owl__.pvnode = pvnode;
 *   });
 * } else {
 *   // this is the 'update' path of the directive.
 *   // the call to __updateProps is the actual component update
 *   // Note that we only update the props if we cannot reuse the previous
 *   // rendering work (in the case it was rendered with the same props)
 *   def3 = def3 || w4.__updateProps(props4, extra.forceUpdate, extra.patchQueue);
 *   def3 = def3.then(() => {
 *     // if component was destroyed in the meantime, we do nothing (so, this
 *     // means that the parent's element children list will have a null in
 *     // the component's position, which will cause the pvnode to be removed
 *     // when it is patched.
 *     if (w4.__owl__.isDestroyed) {
 *       return;
 *     }
 *     // like above, we register the pvnode to the children list, so it
 *     // will not be patched out of the dom.
 *     let pvnode = w4.__owl__.pvnode;
 *     c1[_2_index] = pvnode;
 *   });
 * }
 *
 * // we register the deferred here so the parent can coordinate its patch operation
 * // with all the children.
 * extra.promises.push(def3);
 * return vn1;
 * ```
 */

QWeb.addDirective({
  name: "component",
  extraNames: ["props"],
  priority: 100,
  atNodeEncounter({ ctx, value, node, qweb }): boolean {
    ctx.addLine(`// Component '${value}'`);
    ctx.rootContext.shouldDefineQWeb = true;
    ctx.rootContext.shouldDefineParent = true;
    ctx.rootContext.shouldDefineUtils = true;
    ctx.rootContext.shouldDefineScope = true;
    let hasDynamicProps = node.getAttribute("t-props") ? true : false;

    // t-on- events and t-transition
    const events: [string, string][] = [];
    let transition: string = "";
    const attributes = (<Element>node).attributes;
    const props: { [key: string]: string } = {};
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].name;
      const value = attributes[i].textContent!;
      if (name.startsWith("t-on-")) {
        events.push([name, value]);
      } else if (name === "t-transition") {
        if (QWeb.enableTransitions) {
          transition = value;
        }
      } else if (!name.startsWith("t-")) {
        if (name !== "class" && name !== "style") {
          // this is a prop!
          props[name] = ctx.formatExpression(value) || "undefined";
        }
      }
    }

    // computing the props string representing the props object
    let propStr = Object.keys(props)
      .map((k) => k + ":" + props[k])
      .join(",");
    let componentID = ctx.generateID();

    const templateKey = ctx.generateTemplateKey();
    let ref = node.getAttribute("t-ref");
    let refExpr = "";
    let refKey: string = "";
    if (ref) {
      ctx.rootContext.shouldDefineRefs = true;
      refKey = `ref${ctx.generateID()}`;
      ctx.addLine(`const ${refKey} = ${ctx.interpolate(ref)};`);
      refExpr = `context.__owl__.refs[${refKey}] = w${componentID};`;
    }
    let finalizeComponentCode = `w${componentID}.destroy();`;
    if (ref) {
      finalizeComponentCode += `delete context.__owl__.refs[${refKey}];`;
    }
    if (transition) {
      finalizeComponentCode = `let finalize = () => {
          ${finalizeComponentCode}
        };
        delete w${componentID}.__owl__.transitionInserted;
        utils.transitionRemove(vn, '${transition}', finalize);`;
    }

    let createHook = "";
    let classAttr = node.getAttribute("class");
    let tattClass = node.getAttribute("t-att-class");
    let styleAttr = node.getAttribute("style");
    let tattStyle = node.getAttribute("t-att-style");
    if (tattStyle) {
      const attVar = `_${ctx.generateID()}`;
      ctx.addLine(`const ${attVar} = ${ctx.formatExpression(tattStyle)};`);
      tattStyle = attVar;
    }
    let classObj = "";
    if (classAttr || tattClass || styleAttr || tattStyle || events.length) {
      if (classAttr) {
        let classDef = classAttr
          .trim()
          .split(/\s+/)
          .map((a) => `'${a}':true`)
          .join(",");
        classObj = `_${ctx.generateID()}`;
        ctx.addLine(`let ${classObj} = {${classDef}};`);
      }
      if (tattClass) {
        let tattExpr = ctx.formatExpression(tattClass);
        if (tattExpr[0] !== "{" || tattExpr[tattExpr.length - 1] !== "}") {
          tattExpr = `utils.toObj(${tattExpr})`;
        }
        if (classAttr) {
          ctx.addLine(`Object.assign(${classObj}, ${tattExpr})`);
        } else {
          classObj = `_${ctx.generateID()}`;
          ctx.addLine(`let ${classObj} = ${tattExpr};`);
        }
      }
      let eventsCode = events
        .map(function ([name, value]) {
          const capture = name.match(/\.capture/);
          name = capture ? name.replace(/\.capture/, "") : name;
          const { event, handler } = makeHandlerCode(
            ctx,
            name,
            value,
            false,
            T_COMPONENT_MODS_CODE
          );
          if (capture) {
            return `vn.elm.addEventListener('${event}', ${handler}, true);`;
          }
          return `vn.elm.addEventListener('${event}', ${handler});`;
        })
        .join("");
      const styleExpr = tattStyle || (styleAttr ? `'${styleAttr}'` : false);
      const styleCode = styleExpr ? `vn.elm.style = ${styleExpr};` : "";
      createHook = `utils.assignHooks(vnode.data, {create(_, vn){${styleCode}${eventsCode}}});`;
    }

    ctx.addLine(
      `let w${componentID} = ${templateKey} in parent.__owl__.cmap ? parent.__owl__.children[parent.__owl__.cmap[${templateKey}]] : false;`
    );
    let shouldProxy = !ctx.parentNode;
    if (shouldProxy) {
      let id = ctx.generateID();
      ctx.rootContext.rootNode = id;
      shouldProxy = true;
      ctx.rootContext.shouldDefineResult = true;
      ctx.addLine(`let vn${id} = {};`);
      ctx.addLine(`result = vn${id};`);
    }
    if (hasDynamicProps) {
      const dynamicProp = ctx.formatExpression(node.getAttribute("t-props")!);
      ctx.addLine(`let props${componentID} = Object.assign({}, ${dynamicProp}, {${propStr}});`);
    } else {
      ctx.addLine(`let props${componentID} = {${propStr}};`);
    }
    ctx.addIf(
      `w${componentID} && w${componentID}.__owl__.currentFiber && !w${componentID}.__owl__.vnode`
    );
    ctx.addLine(`w${componentID}.destroy();`);
    ctx.addLine(`w${componentID} = false;`);
    ctx.closeIf();

    let registerCode = "";
    if (shouldProxy) {
      registerCode = `utils.defineProxy(vn${ctx.rootNode}, pvnode);`;
    }

    // SLOTS
    const hasSlots = node.childNodes.length;

    let scope = hasSlots ? `utils.combine(context, scope)` : "undefined";

    ctx.addIf(`w${componentID}`);

    // need to update component
    let styleCode = "";
    if (tattStyle) {
      styleCode = `.then(()=>{if (w${componentID}.__owl__.status === ${STATUS.DESTROYED}) {return};w${componentID}.el.style=${tattStyle};});`;
    }
    ctx.addLine(
      `w${componentID}.__updateProps(props${componentID}, extra.fiber, ${scope})${styleCode};`
    );
    ctx.addLine(`let pvnode = w${componentID}.__owl__.pvnode;`);
    if (registerCode) {
      ctx.addLine(registerCode);
    }
    if (ctx.parentNode) {
      ctx.addLine(`c${ctx.parentNode}.push(pvnode);`);
    }

    ctx.addElse();

    // new component
    const contextualValue = value.match(INTERP_REGEXP) ? "false" : ctx.formatExpression(value);
    const interpValue = ctx.interpolate(value);
    ctx.addLine(`let componentKey${componentID} = ${interpValue};`);
    ctx.addLine(
      `let W${componentID} = ${contextualValue} || context.constructor.components[componentKey${componentID}] || QWeb.components[componentKey${componentID}];`
    );

    // maybe only do this in dev mode...
    ctx.addLine(
      `if (!W${componentID}) {throw new Error('Cannot find the definition of component "' + componentKey${componentID} + '"')}`
    );
    ctx.addLine(`w${componentID} = new W${componentID}(parent, props${componentID});`);
    if (transition) {
      ctx.addLine(`const __patch${componentID} = w${componentID}.__patch;`);
      ctx.addLine(
        `w${componentID}.__patch = (t, vn) => {__patch${componentID}.call(w${componentID}, t, vn); if(!w${componentID}.__owl__.transitionInserted){w${componentID}.__owl__.transitionInserted = true;utils.transitionInsert(w${componentID}.__owl__.vnode, '${transition}');}};`
      );
    }
    ctx.addLine(`parent.__owl__.cmap[${templateKey}] = w${componentID}.__owl__.id;`);

    if (hasSlots) {
      const clone = <Element>node.cloneNode(true);

      // The next code is a fallback for compatibility reason. It accepts t-set
      // elements that are direct children with a non empty body as nodes defining
      // the content of a slot.
      //
      // This is wrong, but is necessary to prevent breaking all existing Owl
      // code using slots. This will be removed in v2.0 someday. Meanwhile,
      // please use t-set-slot everywhere you need to set the content of a
      // slot.
      for (let node of clone.children) {
        if (node.hasAttribute("t-set") && node.hasChildNodes()) {
          node.setAttribute("t-set-slot", node.getAttribute("t-set")!);
          node.removeAttribute("t-set");
        }
      }
      const slotNodes = Array.from(clone.querySelectorAll("[t-set-slot]"));
      const slotNames = new Set<string>();
      const slotId = QWeb.nextSlotId++;
      ctx.addLine(`w${componentID}.__owl__.slotId = ${slotId};`);
      if (slotNodes.length) {
        for (let i = 0, length = slotNodes.length; i < length; i++) {
          const slotNode = slotNodes[i];
          // check if this is defined in a sub component (in which case it should
          // be ignored)
          let el = slotNode.parentElement;
          let isInSubComponent = false;
          while (el !== clone) {
            if (
              el!.hasAttribute("t-component") ||
              el!.tagName[0] === el!.tagName[0].toUpperCase()
            ) {
              isInSubComponent = true;
              break;
            }
            el = el.parentElement;
          }
          if (isInSubComponent) {
            continue;
          }
          let key = slotNode.getAttribute("t-set-slot")!;
          if (slotNames.has(key)) {
            continue;
          }
          slotNames.add(key);
          slotNode.removeAttribute("t-set-slot");
          slotNode.parentElement!.removeChild(slotNode);

          const slotFn = qweb._compile(`slot_${key}_template`, { elem: slotNode, hasParent: true });
          QWeb.slots[`${slotId}_${key}`] = slotFn;
        }
      }
      if (clone.childNodes.length) {
        const t = clone.ownerDocument!.createElement("t");
        for (let child of Object.values(clone.childNodes)) {
          t.appendChild(child);
        }
        const slotFn = qweb._compile(`slot_default_template`, { elem: t, hasParent: true });
        QWeb.slots[`${slotId}_default`] = slotFn;
      }
    }

    ctx.addLine(
      `let fiber = w${componentID}.__prepare(extra.fiber, ${scope}, () => { const vnode = fiber.vnode; pvnode.sel = vnode.sel; ${createHook}});`
    );
    // hack: specify empty remove hook to prevent the node from being removed from the DOM
    const insertHook = refExpr ? `insert(vn) {${refExpr}},` : "";
    ctx.addLine(
      `let pvnode = h('dummy', {key: ${templateKey}, hook: {${insertHook}remove() {},destroy(vn) {${finalizeComponentCode}}}});`
    );
    if (registerCode) {
      ctx.addLine(registerCode);
    }
    if (ctx.parentNode) {
      ctx.addLine(`c${ctx.parentNode}.push(pvnode);`);
    }
    ctx.addLine(`w${componentID}.__owl__.pvnode = pvnode;`);

    ctx.closeIf();

    if (classObj) {
      ctx.addLine(`w${componentID}.__owl__.classObj=${classObj};`);
    }

    ctx.addLine(`w${componentID}.__owl__.parentLastFiberId = extra.fiber.id;`);

    return true;
  },
});
