using UnityEngine;

public class TransformacionCubo : MonoBehaviour
{
    [Header("Configuración de Movimiento")]
    public float velocidadRotacion = 50f;
    public float amplitudEscala = 0.5f;
    public float intervaloTraslacion = 2f;

    private float cronometro = 0f;

    void Update()
    {
        // 1. Rotación constante dependiente de Time.deltaTime
        // Rotamos en los tres ejes para que se aprecie mejor el volumen
        transform.Rotate(new Vector3(1, 1, 1) * velocidadRotacion * Time.deltaTime);

        // 2. Escalado oscilante en función de Mathf.Sin(Time.time)
        // El factor 1f es la escala base, el seno oscila entre -1 y 1
        float escala = 1f + Mathf.Sin(Time.time) * amplitudEscala;
        transform.localScale = new Vector3(escala, escala, escala);

        // 3. Traslación aleatoria cada ciertos segundos
        cronometro += Time.deltaTime;
        if (cronometro >= intervaloTraslacion)
        {
            AplicarTraslacionAleatoria();
            cronometro = 0f;
        }
    }

    void AplicarTraslacionAleatoria()
    {
        // Elegimos un eje aleatorio (X o Y) y un desplazamiento
        float desplazamiento = Random.Range(-1f, 1f);
        
        // Decisión aleatoria entre eje X (0) o eje Y (1)
        if (Random.value > 0.5f)
        {
            transform.Translate(new Vector3(desplazamiento, 0, 0), Space.World);
            Debug.Log($"Traslación en X: {desplazamiento}");
        }
        else
        {
            transform.Translate(new Vector3(0, desplazamiento, 0), Space.World);
            Debug.Log($"Traslación en Y: {desplazamiento}");
        }
    }
}