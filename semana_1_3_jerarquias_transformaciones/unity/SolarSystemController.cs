using UnityEngine;
using UnityEngine.UIElements;

public class SolarSystemController : MonoBehaviour
{
    [Header("Referencias de la Jerarquía")]
    public Transform planet2Padre;
    public Transform planet1Hijo;
    public Transform planetNieto;

    [Header("UI Toolkit")]
    public UIDocument uiDocument; 

    private Slider sliderPadre;
    private Slider sliderHijo;
    private Slider sliderNieto;

    void OnEnable()
    {
        if (uiDocument == null) return;

        VisualElement root = uiDocument.rootVisualElement;

        // Buscamos los sliders por tipo
        var allSliders = root.Query<Slider>().ToList();

        if (allSliders.Count >= 3)
        {
            sliderPadre = allSliders[0];
            sliderHijo = allSliders[1];
            sliderNieto = allSliders[2];

            // Configuramos los sliders
            ConfigurarSlider(sliderPadre, "Rotación Padre", 42); 
            ConfigurarSlider(sliderHijo, "Rotación Hijo", 42);
            ConfigurarSlider(sliderNieto, "Rotación Nieto", 42);

            // Registramos los eventos de cambio
            sliderPadre.RegisterValueChangedCallback(evt => RotatePadre(evt.newValue));
            sliderHijo.RegisterValueChangedCallback(evt => RotateHijo(evt.newValue));
            sliderNieto.RegisterValueChangedCallback(evt => RotateNieto(evt.newValue));
        }
    }

    void ConfigurarSlider(Slider s, string etiqueta, float valorInicial)
    {
        if (s == null) return;
        s.label = etiqueta;
        s.lowValue = 0;
        s.highValue = 360; 
        s.value = valorInicial;
    }

    // Métodos para rotar usando localRotation para respetar la jerarquía
    void RotatePadre(float value) 
    { 
        if(planet2Padre != null) planet2Padre.localRotation = Quaternion.Euler(0, value, 0); 
    }
    
    void RotateHijo(float value) 
    { 
        if(planet1Hijo != null) planet1Hijo.localRotation = Quaternion.Euler(0, value, 0); 
    }
    
    void RotateNieto(float value) 
    { 
        if(planetNieto != null) planetNieto.localRotation = Quaternion.Euler(0, value, 0); 
    }
}