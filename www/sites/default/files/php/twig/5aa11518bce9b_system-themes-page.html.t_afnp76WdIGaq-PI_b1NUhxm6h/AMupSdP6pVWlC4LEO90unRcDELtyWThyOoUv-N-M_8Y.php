<?php

/* core/modules/system/templates/system-themes-page.html.twig */
class __TwigTemplate_636912acacd5c6d9a1b5308603e966ba68b1884c8e87423200cd68d615599195 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array("for" => 34, "set" => 36, "if" => 54);
        $filters = array("safe_join" => 61);
        $functions = array();

        try {
            $this->env->getExtension('Twig_Extension_Sandbox')->checkSecurity(
                array('for', 'set', 'if'),
                array('safe_join'),
                array()
            );
        } catch (Twig_Sandbox_SecurityError $e) {
            $e->setSourceContext($this->getSourceContext());

            if ($e instanceof Twig_Sandbox_SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

        // line 33
        echo "<div";
        echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, ($context["attributes"] ?? null), "html", null, true));
        echo ">
  ";
        // line 34
        $context['_parent'] = $context;
        $context['_seq'] = twig_ensure_traversable(($context["theme_groups"] ?? null));
        foreach ($context['_seq'] as $context["_key"] => $context["theme_group"]) {
            // line 35
            echo "    ";
            // line 36
            $context["theme_group_classes"] = array(0 => "system-themes-list", 1 => ("system-themes-list-" . $this->getAttribute(            // line 38
$context["theme_group"], "state", array())), 2 => "clearfix");
            // line 42
            echo "    <div";
            echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($this->getAttribute($context["theme_group"], "attributes", array()), "addClass", array(0 => ($context["theme_group_classes"] ?? null)), "method"), "html", null, true));
            echo ">
      <h2 class=\"system-themes-list__header\">";
            // line 43
            echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme_group"], "title", array()), "html", null, true));
            echo "</h2>
      ";
            // line 44
            $context['_parent'] = $context;
            $context['_seq'] = twig_ensure_traversable($this->getAttribute($context["theme_group"], "themes", array()));
            foreach ($context['_seq'] as $context["_key"] => $context["theme"]) {
                // line 45
                echo "        ";
                // line 46
                $context["theme_classes"] = array(0 => (($this->getAttribute(                // line 47
$context["theme"], "is_default", array())) ? ("theme-default") : ("")), 1 => (($this->getAttribute(                // line 48
$context["theme"], "is_admin", array())) ? ("theme-admin") : ("")), 2 => "theme-selector", 3 => "clearfix");
                // line 53
                echo "        <div";
                echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($this->getAttribute($context["theme"], "attributes", array()), "addClass", array(0 => ($context["theme_classes"] ?? null)), "method"), "html", null, true));
                echo ">
          ";
                // line 54
                if ($this->getAttribute($context["theme"], "screenshot", array())) {
                    // line 55
                    echo "            ";
                    echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "screenshot", array()), "html", null, true));
                    echo "
          ";
                }
                // line 57
                echo "          <div class=\"theme-info\">
            <h3 class=\"theme-info__header\">";
                // line 59
                echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "name", array()), "html", null, true));
                echo " ";
                echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "version", array()), "html", null, true));
                // line 60
                if ($this->getAttribute($context["theme"], "notes", array())) {
                    // line 61
                    echo "                (";
                    echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->renderVar($this->env->getExtension('Drupal\Core\Template\TwigExtension')->safeJoin($this->env, $this->getAttribute($context["theme"], "notes", array()), ", ")));
                    echo ")";
                }
                // line 63
                echo "</h3>
            <div class=\"theme-info__description\">";
                // line 64
                echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "description", array()), "html", null, true));
                echo "</div>
            ";
                // line 66
                echo "            ";
                if ($this->getAttribute($context["theme"], "incompatible", array())) {
                    // line 67
                    echo "              <div class=\"incompatible\">";
                    echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "incompatible", array()), "html", null, true));
                    echo "</div>
            ";
                } else {
                    // line 69
                    echo "              ";
                    echo $this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed($this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->getAttribute($context["theme"], "operations", array()), "html", null, true));
                    echo "
            ";
                }
                // line 71
                echo "          </div>
        </div>
      ";
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_iterated'], $context['_key'], $context['theme'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 74
            echo "    </div>
  ";
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['_key'], $context['theme_group'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 76
        echo "</div>
";
    }

    public function getTemplateName()
    {
        return "core/modules/system/templates/system-themes-page.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  140 => 76,  133 => 74,  125 => 71,  119 => 69,  113 => 67,  110 => 66,  106 => 64,  103 => 63,  98 => 61,  96 => 60,  92 => 59,  89 => 57,  83 => 55,  81 => 54,  76 => 53,  74 => 48,  73 => 47,  72 => 46,  70 => 45,  66 => 44,  62 => 43,  57 => 42,  55 => 38,  54 => 36,  52 => 35,  48 => 34,  43 => 33,);
    }

    /** @deprecated since 1.27 (to be removed in 2.0). Use getSourceContext() instead */
    public function getSource()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getSourceContext() instead.', E_USER_DEPRECATED);

        return $this->getSourceContext()->getCode();
    }

    public function getSourceContext()
    {
        return new Twig_Source("", "core/modules/system/templates/system-themes-page.html.twig", "/vagrant/www/core/modules/system/templates/system-themes-page.html.twig");
    }
}
