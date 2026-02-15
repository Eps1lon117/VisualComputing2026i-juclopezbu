using UnityEngine;

public class MeshAnalyzer : MonoBehaviour
{
    void Start()
    {
        // Buscar MeshFilter primero
        MeshFilter mf = GetComponentInChildren<MeshFilter>();

        Mesh mesh = null;

        if (mf != null)
        {
            mesh = mf.sharedMesh;
        }
        else
        {
            // Buscar SkinnedMeshRenderer si no hay MeshFilter
            SkinnedMeshRenderer smr = GetComponentInChildren<SkinnedMeshRenderer>();

            if (smr != null)
            {
                mesh = smr.sharedMesh;
            }
        }

        if (mesh == null)
        {
            Debug.LogError("No mesh found at all");
            return;
        }

        Debug.Log("===== MESH INFO =====");
        Debug.Log("Vertices: " + mesh.vertexCount);
        Debug.Log("Triangles: " + mesh.triangles.Length / 3);
        Debug.Log("SubMeshes: " + mesh.subMeshCount);
    }
}
