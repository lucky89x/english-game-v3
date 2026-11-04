shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform vec3 earth_dark : source_color = vec3(0.28, 0.17, 0.09);
uniform vec3 earth_light : source_color = vec3(0.56, 0.38, 0.18);
uniform vec3 grassy_edge : source_color = vec3(0.24, 0.43, 0.18);

void fragment() {
	float edge = smoothstep(0.56, 0.98, abs(UV.x * 2.0 - 1.0));
	float grain = sin(UV.y * 39.0 + sin(UV.x * 17.0)) * 0.5 + 0.5;
	vec3 dirt = mix(earth_dark, earth_light, 0.48 + grain * 0.18);
	ALBEDO = mix(dirt, grassy_edge, edge * 0.64);
	ROUGHNESS = 0.97;
	SPECULAR = 0.08;
}
