shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform vec3 grass_dark : source_color = vec3(0.12, 0.29, 0.14);
uniform vec3 grass_mid : source_color = vec3(0.22, 0.43, 0.22);
uniform vec3 grass_sun : source_color = vec3(0.34, 0.51, 0.24);

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float broad = sin(world_position.x * 0.27) * cos(world_position.z * 0.23);
	float detail = sin((world_position.x + world_position.z) * 1.7) * 0.5
		+ cos((world_position.x - world_position.z) * 2.3) * 0.5;
	float variation = clamp(0.52 + broad * 0.2 + detail * 0.055, 0.0, 1.0);
	vec3 grass = mix(grass_dark, grass_mid, variation);
	grass = mix(grass, grass_sun, smoothstep(0.7, 1.0, variation) * 0.35);
	ALBEDO = grass;
	ROUGHNESS = 0.94;
	SPECULAR = 0.16;
}
