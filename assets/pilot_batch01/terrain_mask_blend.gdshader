shader_type spatial;
uniform sampler2D detail_texture : source_color, filter_linear_mipmap, repeat_enable;
void fragment() {
	float detail = texture(detail_texture,UV).r;
	vec3 young_grass = vec3(0.26,0.38,0.12);
	vec3 dark_grass = vec3(0.12,0.23,0.10);
	vec3 worn_earth = vec3(0.36,0.25,0.14);
	vec3 gravel = vec3(0.33,0.34,0.30);
	vec3 wet_earth = vec3(0.17,0.13,0.095);
	vec4 weights = COLOR / max(dot(COLOR,vec4(1.0)),0.001);
	ALBEDO = mix(dark_grass,young_grass,smoothstep(0.2,0.7,detail))*weights.r + worn_earth*weights.g + gravel*weights.b + wet_earth*weights.a;
	ALBEDO *= 0.9 + detail*0.2;
	ROUGHNESS = mix(0.95,0.6,weights.a);
}
