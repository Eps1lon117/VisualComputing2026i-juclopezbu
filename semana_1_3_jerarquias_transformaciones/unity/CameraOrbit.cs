using UnityEngine;

public class CameraOrbit : MonoBehaviour
{
    public Transform systemRoot;   // SunPivot
    public float height = 10f;
    public float orbitSpeed = 10f;
    public float distanceMultiplier = 3f;

    private float distance;
    private float angle;

    void Start()
    {
        distance = CalculateHierarchyRadius(systemRoot) * distanceMultiplier;
    }

    void LateUpdate()
    {
        if (!systemRoot) return;

        angle += orbitSpeed * Time.deltaTime;
        float rad = angle * Mathf.Deg2Rad;

        Vector3 pos = new Vector3(
            systemRoot.position.x + Mathf.Cos(rad) * distance,
            systemRoot.position.y + height,
            systemRoot.position.z + Mathf.Sin(rad) * distance
        );

        transform.position = pos;
        transform.LookAt(systemRoot.position);
    }

    //  calcula tamaño basado en jerarquía (NO meshes)
    float CalculateHierarchyRadius(Transform root)
    {
        float maxDist = 0f;

        foreach (Transform child in root.GetComponentsInChildren<Transform>())
        {
            float d = Vector3.Distance(root.position, child.position);
            if (d > maxDist)
                maxDist = d;
        }

        return maxDist;
    }
}